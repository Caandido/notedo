"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RichEditor } from "@/components/editor/rich-editor";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getActivity, getSubjectsForUser } from "@/lib/queries";
import {
  saveActivityContent,
  setActivityStatus,
  updateActivity,
} from "@/features/activities/actions";
import type { ActivityStatus, ActivityType } from "@/lib/db/schema";
import {
  ACTIVITY_TYPES,
  STATUS_LABELS,
  STATUSES,
  TYPE_LABELS,
} from "./activity-styles";

const inputCls =
  "h-8 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-sm outline-none focus:border-[var(--color-ring)]";

function msToDateInput(ms: number | null): string {
  if (ms == null) return "";
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

type Meta = {
  title: string;
  type: ActivityType;
  subjectId: string;
  dueDate: string;
  grade: string;
  maxGrade: string;
};

export function ActivityEditor({ id }: { id: string }) {
  const router = useRouter();
  const { data: subjects } = useRepoQuery(() => getSubjectsForUser(), []);
  const [loaded, setLoaded] = React.useState(false);
  const [missing, setMissing] = React.useState(false);
  const [status, setStatus] = React.useState<ActivityStatus>("TODO");
  const [content, setContent] = React.useState<unknown>(null);
  const [meta, setMeta] = React.useState<Meta>({
    title: "",
    type: "ATIVIDADE",
    subjectId: "",
    dueDate: "",
    grade: "",
    maxGrade: "",
  });

  React.useEffect(() => {
    let active = true;
    void getActivity(id).then((a) => {
      if (!active) return;
      if (!a) {
        setMissing(true);
        setLoaded(true);
        return;
      }
      setStatus(a.status);
      setContent(a.content ?? null);
      setMeta({
        title: a.title,
        type: a.type,
        subjectId: a.subjectId ?? "",
        dueDate: msToDateInput(a.dueDate),
        grade: a.grade != null ? String(a.grade) : "",
        maxGrade: a.maxGrade != null ? String(a.maxGrade) : "",
      });
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const persist = React.useCallback(
    (next: Meta) => {
      setMeta(next);
      void updateActivity({
        id,
        title: next.title,
        type: next.type,
        subjectId: next.subjectId || null,
        dueDate: next.dueDate || null,
        grade: next.grade.trim() === "" ? null : Number(next.grade),
        maxGrade: next.maxGrade.trim() === "" ? null : Number(next.maxGrade),
      });
    },
    [id]
  );

  const saveContent = React.useCallback(
    (c: unknown) => saveActivityContent(id, c),
    [id]
  );

  async function changeStatus(s: ActivityStatus) {
    setStatus(s);
    await setActivityStatus(id, s);
  }

  if (!loaded)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    );
  if (missing)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <p className="text-sm font-medium">Atividade não encontrada.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/activities")}>
          Voltar
        </Button>
      </div>
    );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 px-4 backdrop-blur-md">
        <Button variant="ghost" size="icon" aria-label="Voltar" onClick={() => router.push("/activities")}>
          <ArrowLeft className="size-4" />
        </Button>
        <input
          value={meta.title}
          onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
          onBlur={() => persist(meta)}
          maxLength={160}
          placeholder="Título"
          className="h-9 min-w-0 flex-1 rounded-md bg-transparent px-2 text-sm font-semibold outline-none focus:bg-[var(--color-card)]"
        />
      </header>

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Tipo">
            <select
              className={inputCls}
              value={meta.type}
              onChange={(e) => persist({ ...meta, type: e.target.value as ActivityType })}
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={inputCls}
              value={status}
              onChange={(e) => void changeStatus(e.target.value as ActivityStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="Matéria">
            <select
              className={inputCls}
              value={meta.subjectId}
              onChange={(e) => persist({ ...meta, subjectId: e.target.value })}
            >
              <option value="">Nenhuma</option>
              {(subjects ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Prazo">
            <input
              type="date"
              className={inputCls}
              value={meta.dueDate}
              onChange={(e) => persist({ ...meta, dueDate: e.target.value })}
            />
          </Field>
          <Field label="Nota">
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                placeholder="—"
                className={`${inputCls} w-16`}
                value={meta.grade}
                onChange={(e) => setMeta((m) => ({ ...m, grade: e.target.value }))}
                onBlur={() => persist(meta)}
              />
              <span className="text-xs text-[var(--color-muted-foreground)]">/</span>
              <input
                type="number"
                step="0.1"
                placeholder="—"
                className={`${inputCls} w-16`}
                value={meta.maxGrade}
                onChange={(e) => setMeta((m) => ({ ...m, maxGrade: e.target.value }))}
                onBlur={() => persist(meta)}
              />
            </div>
          </Field>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <RichEditor
            initialContent={content}
            onSave={saveContent}
            placeholder="Escreva sua redação / resolução aqui…"
          />
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-medium text-[var(--color-muted-foreground)]">
        {label}
      </label>
      {children}
    </div>
  );
}
