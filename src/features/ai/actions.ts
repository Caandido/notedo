"use client";

import { cuid } from "@/lib/db";
import { writeBulkAdd } from "@/lib/db/write";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1500;
const API_KEY_STORAGE = "notedo:anthropic-key";

export type GeneratedCard = { front: string; back: string };

const SYSTEM_PROMPT = `Você gera flashcards de estudo de alta qualidade a partir de notas/conteúdo.

Regras:
- Cada cartão tem "front" (pergunta concisa) e "back" (resposta curta e direta).
- Foque em conceitos atômicos. Um conceito = um cartão.
- Português brasileiro.
- Gere entre 5 e 12 cartões, mas só os que forem realmente úteis.

Retorne APENAS um JSON válido no formato:
{"cards":[{"front":"...","back":"..."},...]}
Nada além desse JSON.`;

export function setAnthropicKey(key: string) {
  if (typeof window === "undefined") return;
  if (key.trim()) window.localStorage.setItem(API_KEY_STORAGE, key.trim());
  else window.localStorage.removeItem(API_KEY_STORAGE);
}

export function getAnthropicKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(API_KEY_STORAGE);
}

export async function generateFlashcardsFromText(rawText: string) {
  const text = rawText.trim();
  if (!text) return { ok: false as const, error: "Texto vazio." };
  if (text.length < 30)
    return { ok: false as const, error: "Texto muito curto (mín. 30 chars)." };
  if (text.length > 8000)
    return { ok: false as const, error: "Texto muito longo (máx. 8000 chars)." };

  const apiKey = getAnthropicKey();
  if (!apiKey) {
    return {
      ok: false as const,
      error:
        "Chave Anthropic não configurada. Adicione em /settings → IA.",
    };
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return {
      ok: false as const,
      error: "Sem internet. Conecte-se para gerar flashcards.",
    };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Gere flashcards a partir do seguinte conteúdo:\n\n${text}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return {
      ok: false as const,
      error: `Erro da API (${response.status}). ${detail.slice(0, 200)}`,
    };
  }

  const data = (await response.json()) as {
    content?: { type: string; text?: string }[];
  };
  const raw =
    data.content?.find((c) => c.type === "text")?.text?.trim() ?? "";

  let parsed: { cards?: GeneratedCard[] };
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    return { ok: false as const, error: "Resposta não pôde ser parseada." };
  }

  const cards = Array.isArray(parsed.cards)
    ? parsed.cards
        .filter(
          (c) =>
            typeof c?.front === "string" &&
            typeof c?.back === "string" &&
            c.front.trim() &&
            c.back.trim()
        )
        .map((c) => ({ front: c.front.trim(), back: c.back.trim() }))
        .slice(0, 20)
    : [];

  if (cards.length === 0)
    return { ok: false as const, error: "Nenhum flashcard útil." };

  return { ok: true as const, cards };
}

export type SaveGeneratedInput = {
  cards: GeneratedCard[];
  deck?: string;
};

export async function saveGeneratedCards(input: SaveGeneratedInput) {
  if (!Array.isArray(input.cards) || input.cards.length === 0)
    return { ok: false as const, error: "Sem cartões." };

  const valid = input.cards
    .filter(
      (c) =>
        c.front?.trim() &&
        c.back?.trim() &&
        c.front.length <= 600 &&
        c.back.length <= 600
    )
    .map((c) => ({ front: c.front.trim(), back: c.back.trim() }));

  if (valid.length === 0)
    return { ok: false as const, error: "Nenhum cartão válido." };

  const userId = getCurrentUserId();
  const deck = input.deck?.trim().slice(0, 60) || null;
  const now = Date.now();

  await writeBulkAdd(
    "flashcards",
    valid.map((c) => ({
      id: cuid(),
      userId,
      front: c.front,
      back: c.back,
      deck,
      ease: 2.5,
      interval: 1,
      nextReview: now,
      createdAt: now,
    }))
  );

  invalidateAll();
  return { ok: true as const, count: valid.length };
}
