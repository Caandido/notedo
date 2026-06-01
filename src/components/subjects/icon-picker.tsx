"use client";

import { cn } from "@/lib/utils";
import { SUBJECT_ICON_KEYS, SUBJECT_ICONS } from "@/lib/subject-icons";

interface IconPickerProps {
  value: string | null;
  onChange: (key: string | null) => void;
  /** Cor de destaque do ícone selecionado (cor da matéria). */
  accent?: string;
}

/**
 * Grade de ícones monocromáticos pra matéria. Os ícones herdam currentColor
 * (pretos no tema claro, brancos no escuro); o selecionado ganha a cor da
 * matéria. "Nenhum" volta ao indicador de bolinha padrão.
 */
export function IconPicker({ value, onChange, accent }: IconPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-label="Sem ícone"
        aria-pressed={value == null}
        title="Sem ícone"
        className={cn(
          "flex size-8 items-center justify-center rounded-md border text-[10px] transition-colors",
          value == null
            ? "border-[var(--color-ring)] bg-[var(--color-accent)] text-[var(--color-foreground)]"
            : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        )}
      >
        —
      </button>
      {SUBJECT_ICON_KEYS.map((key) => {
        const Icon = SUBJECT_ICONS[key];
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-label={`Ícone ${key}`}
            aria-pressed={active}
            className={cn(
              "flex size-8 items-center justify-center rounded-md border transition-colors",
              active
                ? "border-[var(--color-ring)] bg-[var(--color-accent)]"
                : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            )}
            style={active && accent ? { color: accent } : undefined}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
