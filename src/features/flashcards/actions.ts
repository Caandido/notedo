"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;
const MAX_EASE = 2.8;
const MAX_INTERVAL_DAYS = 365;

export type Quality = 0 | 1 | 2 | 3;

export type CreateFlashcardInput = {
  front: string;
  back: string;
  deck?: string;
};

export async function createFlashcard(input: CreateFlashcardInput) {
  const front = input.front.trim();
  const back = input.back.trim();
  if (!front || !back)
    return { ok: false as const, error: "Frente e verso são obrigatórios." };
  if (front.length > 600 || back.length > 600)
    return { ok: false as const, error: "Texto muito longo." };

  const userId = await getCurrentUserId();
  const deck = input.deck?.trim().slice(0, 60) || null;

  await prisma.flashcard.create({
    data: {
      userId,
      front,
      back,
      deck: deck ?? undefined,
      ease: 2.5,
      interval: 1,
      nextReview: new Date(),
    },
  });

  revalidatePath("/reviews");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteFlashcard(id: string) {
  const userId = await getCurrentUserId();
  const deleted = await prisma.flashcard.deleteMany({
    where: { id, userId },
  });
  if (deleted.count === 0)
    return { ok: false as const, error: "Flashcard não encontrado." };
  revalidatePath("/reviews");
  return { ok: true as const };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function applySm2(quality: Quality, ease: number, interval: number) {
  let newEase = ease;
  let newInterval = interval;

  switch (quality) {
    case 0:
      newInterval = 1;
      newEase = clamp(ease - 0.2, MIN_EASE, MAX_EASE);
      break;
    case 1:
      newInterval = Math.max(1, Math.round(interval * 1.2));
      newEase = clamp(ease - 0.15, MIN_EASE, MAX_EASE);
      break;
    case 2:
      newInterval = Math.max(1, Math.round(interval * ease));
      break;
    case 3:
      newInterval = Math.max(1, Math.round(interval * ease * 1.3));
      newEase = clamp(ease + 0.15, MIN_EASE, MAX_EASE);
      break;
  }

  newInterval = Math.min(MAX_INTERVAL_DAYS, newInterval);
  const nextReview = new Date(Date.now() + newInterval * DAY_MS);
  return { ease: newEase, interval: newInterval, nextReview };
}

export async function gradeFlashcard(id: string, quality: Quality) {
  if (![0, 1, 2, 3].includes(quality))
    return { ok: false as const, error: "Avaliação inválida." };

  const userId = await getCurrentUserId();
  const card = await prisma.flashcard.findFirst({
    where: { id, userId },
  });
  if (!card) return { ok: false as const, error: "Flashcard não encontrado." };

  const next = applySm2(quality, card.ease, card.interval);

  await prisma.flashcard.update({
    where: { id: card.id },
    data: next,
  });

  revalidatePath("/reviews");
  revalidatePath("/reviews/study");
  revalidatePath("/");
  return { ok: true as const, nextReview: next.nextReview.toISOString() };
}
