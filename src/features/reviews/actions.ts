"use client";

import { cuid, db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";

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
  const ts = new Date(input.scheduledAt).getTime();
  if (Number.isNaN(ts)) return { ok: false as const, error: "Data inválida." };

  const userId = getCurrentUserId();
  if (input.subjectId) {
    const subject = await db().subjects.get(input.subjectId);
    if (!subject || subject.userId !== userId)
      return { ok: false as const, error: "Matéria não encontrada." };
  }

  await db().reviews.add({
    id: cuid(),
    userId,
    subjectId: input.subjectId,
    title,
    scheduledAt: ts,
    completedAt: null,
    interval: 1,
    ease: 2.5,
    status: "PENDING",
    createdAt: Date.now(),
  });
  invalidateAll();
  return { ok: true as const };
}

export async function completeReview(reviewId: string) {
  const userId = getCurrentUserId();
  const review = await db().reviews.get(reviewId);
  if (!review || review.userId !== userId)
    return { ok: false as const, error: "Revisão não encontrada." };

  const nextInterval = Math.min(MAX_INTERVAL_DAYS, review.interval * 2);
  const nextScheduledAt = Date.now() + nextInterval * DAY_MS;

  await db().transaction("rw", db().reviews, async () => {
    await db().reviews.update(review.id, {
      status: "COMPLETED",
      completedAt: Date.now(),
    });
    await db().reviews.add({
      id: cuid(),
      userId,
      subjectId: review.subjectId,
      title: review.title,
      scheduledAt: nextScheduledAt,
      completedAt: null,
      interval: nextInterval,
      ease: review.ease,
      status: "PENDING",
      createdAt: Date.now(),
    });
  });
  invalidateAll();
  return { ok: true as const };
}

export async function skipReview(reviewId: string) {
  const userId = getCurrentUserId();
  const review = await db().reviews.get(reviewId);
  if (!review || review.userId !== userId)
    return { ok: false as const, error: "Revisão não encontrada." };

  await db().transaction("rw", db().reviews, async () => {
    await db().reviews.update(review.id, {
      status: "SKIPPED",
      completedAt: Date.now(),
    });
    await db().reviews.add({
      id: cuid(),
      userId,
      subjectId: review.subjectId,
      title: review.title,
      scheduledAt: Date.now() + DAY_MS,
      completedAt: null,
      interval: review.interval,
      ease: review.ease,
      status: "PENDING",
      createdAt: Date.now(),
    });
  });
  invalidateAll();
  return { ok: true as const };
}

export type UpdateReviewInput = {
  id: string;
  title: string;
  scheduledAt: string;
};

export async function updateReview(input: UpdateReviewInput) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Título obrigatório." };
  const ts = new Date(input.scheduledAt).getTime();
  if (Number.isNaN(ts)) return { ok: false as const, error: "Data inválida." };

  const userId = getCurrentUserId();
  const review = await db().reviews.get(input.id);
  if (!review || review.userId !== userId)
    return { ok: false as const, error: "Revisão não encontrada." };

  await db().reviews.update(input.id, { title, scheduledAt: ts });
  invalidateAll();
  return { ok: true as const };
}

export async function deleteReview(reviewId: string) {
  const userId = getCurrentUserId();
  const review = await db().reviews.get(reviewId);
  if (!review || review.userId !== userId)
    return { ok: false as const, error: "Revisão não encontrada." };
  await db().reviews.delete(reviewId);
  invalidateAll();
  return { ok: true as const };
}
