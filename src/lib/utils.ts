import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatHours(seconds: number): string {
  const hours = seconds / 3600;
  return hours.toFixed(1) + "h";
}

/**
 * Converte o valor de um <input type="date"> ("YYYY-MM-DD") para o timestamp
 * da meia-noite LOCAL daquele dia. `new Date("YYYY-MM-DD")` parseia como UTC,
 * o que desloca o dia em fusos negativos (ex.: Brasil UTC-3, vira o dia anterior).
 * Retorna NaN se a string for inválida (preserva validações existentes).
 */
export function dateInputToMs(value: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0).getTime();
  }
  return new Date(value).getTime();
}
