"use client";

/**
 * Semestre/período acadêmico no formato "AAAA.N" (N = 1 jan–jun, 2 jul–dez).
 * Notas são marcadas por semestre e a tela de Notas filtra por ele.
 */
export const ALL_SEMESTERS = "ALL";
const KEY = "notedo:semester";

export function currentSemester(now: Date = new Date()): string {
  const half = now.getMonth() <= 5 ? 1 : 2;
  return `${now.getFullYear()}.${half}`;
}

export function semesterLabel(s: string): string {
  if (s === ALL_SEMESTERS) return "Todos os semestres";
  if (s === "") return "Sem semestre";
  return s;
}

export function getStoredSemester(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function setStoredSemester(s: string): void {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, s);
}
