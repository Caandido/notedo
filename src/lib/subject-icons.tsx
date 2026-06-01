"use client";

import {
  Atom,
  BookOpen,
  Brain,
  Calculator,
  Code2,
  Dna,
  Drama,
  FlaskConical,
  Globe2,
  GraduationCap,
  Languages,
  Landmark,
  Leaf,
  Microscope,
  Music,
  Palette,
  PenTool,
  Scale,
  Sigma,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

/**
 * Ícones monocromáticos para matérias (herdam currentColor — pretos no claro,
 * brancos no escuro). A chave é o que fica salvo em `SubjectRow.icon`.
 */
export const SUBJECT_ICONS: Record<string, LucideIcon> = {
  book: BookOpen,
  sigma: Sigma,
  calculator: Calculator,
  atom: Atom,
  flask: FlaskConical,
  dna: Dna,
  microscope: Microscope,
  leaf: Leaf,
  globe: Globe2,
  landmark: Landmark,
  scale: Scale,
  languages: Languages,
  code: Code2,
  brain: Brain,
  palette: Palette,
  music: Music,
  drama: Drama,
  pen: PenTool,
  stethoscope: Stethoscope,
  cap: GraduationCap,
};

/** Ordem de exibição no seletor. */
export const SUBJECT_ICON_KEYS = Object.keys(SUBJECT_ICONS);

/** Resolve a chave salva no ícone (null/desconhecida -> fallback livro). */
export function subjectIcon(key?: string | null): LucideIcon {
  return (key && SUBJECT_ICONS[key]) || BookOpen;
}
