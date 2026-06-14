"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FolderInput, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { bulkMoveSemester } from "@/features/grades/actions";
import { ALL_SEMESTERS, currentSemester, semesterLabel } from "@/lib/semester";

/**
 * Atalho pra organizar semestres: move em massa todas as notas de um semestre
 * (ou as "sem semestre") pra outro. Útil pra arrumar notas antigas de uma vez.
 */
export function MoveSemesterForm({
  semesters,
  defaultFrom,
}: {
  semesters: string[];
  defaultFrom: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [from, setFrom] = React.useState(
    defaultFrom === ALL_SEMESTERS ? "" : defaultFrom
  );
  const [to, setTo] = React.useState(currentSemester());
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  // Garante que "Sem semestre" ("") apareça como origem possível.
  const origins = semesters.includes("") ? semesters : ["", ...semesters];

  async function submit() {
    if ((to.trim() || "") === from) {
      setMsg("Origem e destino são iguais.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const r = await bulkMoveSemester(from, to);
    setBusy(false);
    setMsg(
      r.count === 0
        ? "Nenhuma nota nesse semestre."
        : `${r.count} nota${r.count === 1 ? "" : "s"} movida${r.count === 1 ? "" : "s"}.`
    );
    router.refresh();
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs text-[var(--color-muted-foreground)]"
        onClick={() => setOpen(true)}
      >
        <FolderInput className="size-3.5" />
        Organizar semestres
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-[var(--color-muted-foreground)]">
          Mover notas de
        </label>
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none focus:border-[var(--color-ring)]"
        >
          {origins.map((s) => (
            <option key={s || "none"} value={s}>
              {semesterLabel(s)}
            </option>
          ))}
        </select>
      </div>
      <ArrowRight className="mb-2 size-4 text-[var(--color-muted-foreground)]" />
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-[var(--color-muted-foreground)]">
          para
        </label>
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="ex: 2026.1"
          maxLength={20}
          className="h-9 w-28 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none focus:border-[var(--color-ring)]"
        />
      </div>
      <Button size="sm" onClick={submit} disabled={busy} className="gap-1.5">
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
        Mover
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Fechar"
        onClick={() => {
          setOpen(false);
          setMsg(null);
        }}
      >
        <X className="size-4" />
      </Button>
      {msg && (
        <span className="self-center text-xs text-[var(--color-muted-foreground)]">
          {msg}
        </span>
      )}
    </div>
  );
}
