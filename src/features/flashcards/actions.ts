"use client";

import { cuid, db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";

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

  const userId = getCurrentUserId();
  await db().flashcards.add({
    id: cuid(),
    userId,
    front,
    back,
    deck: input.deck?.trim().slice(0, 60) || null,
    ease: 2.5,
    interval: 1,
    nextReview: Date.now(),
    createdAt: Date.now(),
  });
  invalidateAll();
  return { ok: true as const };
}

export async function deleteFlashcard(id: string) {
  const userId = getCurrentUserId();
  const card = await db().flashcards.get(id);
  if (!card || card.userId !== userId)
    return { ok: false as const, error: "Flashcard não encontrado." };
  await db().flashcards.delete(id);
  invalidateAll();
  return { ok: true as const };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function gradeFlashcard(id: string, quality: Quality) {
  if (![0, 1, 2, 3].includes(quality))
    return { ok: false as const, error: "Avaliação inválida." };

  const userId = getCurrentUserId();
  const card = await db().flashcards.get(id);
  if (!card || card.userId !== userId)
    return { ok: false as const, error: "Flashcard não encontrado." };

  let newEase = card.ease;
  let newInterval = card.interval;
  switch (quality) {
    case 0:
      newInterval = 1;
      newEase = clamp(card.ease - 0.2, MIN_EASE, MAX_EASE);
      break;
    case 1:
      newInterval = Math.max(1, Math.round(card.interval * 1.2));
      newEase = clamp(card.ease - 0.15, MIN_EASE, MAX_EASE);
      break;
    case 2:
      newInterval = Math.max(1, Math.round(card.interval * card.ease));
      break;
    case 3:
      newInterval = Math.max(1, Math.round(card.interval * card.ease * 1.3));
      newEase = clamp(card.ease + 0.15, MIN_EASE, MAX_EASE);
      break;
  }
  newInterval = Math.min(MAX_INTERVAL_DAYS, newInterval);
  const nextReview = Date.now() + newInterval * DAY_MS;

  await db().flashcards.update(id, {
    ease: newEase,
    interval: newInterval,
    nextReview,
  });
  invalidateAll();
  return { ok: true as const, nextReview: new Date(nextReview).toISOString() };
}
