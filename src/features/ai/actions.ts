"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1500;

export type GeneratedCard = { front: string; back: string };

const SYSTEM_PROMPT = `Você gera flashcards de estudo de alta qualidade a partir de notas/conteúdo.

Regras:
- Cada cartão tem "front" (pergunta concisa) e "back" (resposta curta e direta).
- Foque em conceitos atômicos. Um conceito = um cartão.
- Português brasileiro.
- Gere entre 5 e 12 cartões, mas só os que forem realmente úteis.
- Não use formatação Markdown nos textos. Apenas texto puro.

Retorne APENAS um JSON válido no formato:
{"cards":[{"front":"...","back":"..."},...]}
Nada além desse JSON.`;

export async function generateFlashcardsFromText(rawText: string) {
  const text = rawText.trim();
  if (!text) return { ok: false as const, error: "Texto vazio." };
  if (text.length < 30)
    return { ok: false as const, error: "Texto muito curto (mín. 30 chars)." };
  if (text.length > 8000)
    return { ok: false as const, error: "Texto muito longo (máx. 8000 chars)." };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false as const,
      error:
        "ANTHROPIC_API_KEY não configurada. Adicione a variável de ambiente no Vercel e nas envs locais.",
    };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
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
    return {
      ok: false as const,
      error: "Resposta do modelo não pôde ser parseada como JSON.",
    };
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

  if (cards.length === 0) {
    return {
      ok: false as const,
      error: "Nenhum flashcard útil foi extraído. Tente um texto mais denso.",
    };
  }

  return { ok: true as const, cards };
}

export type SaveGeneratedInput = {
  cards: GeneratedCard[];
  deck?: string;
};

export async function saveGeneratedCards(input: SaveGeneratedInput) {
  if (!Array.isArray(input.cards) || input.cards.length === 0)
    return { ok: false as const, error: "Sem cartões para salvar." };

  const valid = input.cards
    .filter(
      (c) =>
        typeof c.front === "string" &&
        typeof c.back === "string" &&
        c.front.trim() &&
        c.back.trim() &&
        c.front.length <= 600 &&
        c.back.length <= 600
    )
    .map((c) => ({
      front: c.front.trim(),
      back: c.back.trim(),
    }));

  if (valid.length === 0)
    return { ok: false as const, error: "Nenhum cartão válido." };

  const userId = await getCurrentUserId();
  const deck = input.deck?.trim().slice(0, 60) || null;

  await prisma.flashcard.createMany({
    data: valid.map((c) => ({
      userId,
      front: c.front,
      back: c.back,
      deck: deck ?? undefined,
      ease: 2.5,
      interval: 1,
      nextReview: new Date(),
    })),
  });

  revalidatePath("/reviews");
  revalidatePath("/");

  return { ok: true as const, count: valid.length };
}
