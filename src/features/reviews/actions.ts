"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_INTERVAL_DAYS = 60;

export type CreateReviewInput = {
  subjectId: string | null;
  title: string;
  scheduledAt: string;
};

export async function createReview(input: CreateReviewInput) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Título obrigatório." };
  if (title.length > 120)
    return { ok: false as const, error: "Título muito longo." };

  const date = new Date(input.scheduledAt);
  if (Number.isNaN(date.getTime()))
    return { ok: false as const, error: "Data inválida." };

  const userId = await getCurrentUserId();

  if (input.subjectId) {
    const owned = await prisma.subject.findFirst({
      where: { id: input.subjectId, userId },
      select: { id: true },
    });
    if (!owned) return { ok: false as const, error: "Matéria não encontrada." };
  }

  await prisma.review.create({
    data: {
      userId,
      subjectId: input.subjectId ?? undefined,
      title,
      scheduledAt: date,
      interval: 1,
      ease: 2.5,
      status: "PENDING",
    },
  });

  revalidatePath("/reviews");
  revalidatePath("/");
  return { ok: true as const };
}

export async function completeReview(reviewId: string) {
  const userId = await getCurrentUserId();
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId },
  });
  if (!review) return { ok: false as const, error: "Revisão não encontrada." };

  const nextInterval = Math.min(MAX_INTERVAL_DAYS, review.interval * 2);
  const nextScheduledAt = new Date(Date.now() + nextInterval * DAY_MS);

  await prisma.$transaction([
    prisma.review.update({
      where: { id: review.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
    prisma.review.create({
      data: {
        userId,
        subjectId: review.subjectId,
        title: review.title,
        scheduledAt: nextScheduledAt,
        interval: nextInterval,
        ease: review.ease,
        status: "PENDING",
      },
    }),
  ]);

  revalidatePath("/reviews");
  revalidatePath("/");
  return { ok: true as const };
}

export async function skipReview(reviewId: string) {
  const userId = await getCurrentUserId();
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId },
  });
  if (!review) return { ok: false as const, error: "Revisão não encontrada." };

  const nextScheduledAt = new Date(Date.now() + DAY_MS);

  await prisma.$transaction([
    prisma.review.update({
      where: { id: review.id },
      data: { status: "SKIPPED", completedAt: new Date() },
    }),
    prisma.review.create({
      data: {
        userId,
        subjectId: review.subjectId,
        title: review.title,
        scheduledAt: nextScheduledAt,
        interval: review.interval,
        ease: review.ease,
        status: "PENDING",
      },
    }),
  ]);

  revalidatePath("/reviews");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteReview(reviewId: string) {
  const userId = await getCurrentUserId();
  const deleted = await prisma.review.deleteMany({
    where: { id: reviewId, userId },
  });
  if (deleted.count === 0)
    return { ok: false as const, error: "Revisão não encontrada." };

  revalidatePath("/reviews");
  revalidatePath("/");
  return { ok: true as const };
}
