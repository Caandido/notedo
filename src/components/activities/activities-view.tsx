"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  KanbanSquare,
  List as ListIcon,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getActivitiesForUser, getSubjectsForUser } from "@/lib/queries";
import type { ActivityListItem } from "@/lib/queries";
import type { ActivityStatus, ActivityType } from "@/lib/db/schema";
import {
  deleteActivity,
  setActivityStatus,
} from "@/features/activities/actions";
import {
  ACTIVITY_TYPES,
  STATUS_LABELS,
  STATUSES,
  TYPE_COLORS,
  TYPE_LABELS,
} from "./activity-styles";

function formatDue(ms: number | null): string | null {
  if (ms == null) return null;
  const d = new Date(ms);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function isOverdue(a: ActivityListItem): boolean {
  return a.dueDate != null && a.status !== "DONE" && a.dueDate < Date.now();
}

const selectCls =
  "h-8 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-2 text-xs outline-none focus:border-[var(--color-ring)]";

export function ActivitiesView() {
  const router = useRouter();
  const { data: activities, loading } = useRepoQuery(
    () => getActivitiesForUser(),
    []
  );
  const { data: subjects } = useRepoQuery(() => getSubjectsForUser(), []);

  const [view, setView] = React.useState<"list" | "kanban">("list");
  const [fType, setFType] = React.useState<ActivityType | "">("");
  const [fSubject, setFSubject] = React.useState<string>("");
  const [fStatus, setFStatus] = React.useState<ActivityStatus | "">("");

  const open = (id: string) => router.push(`/activity?id=${id}`);

  async function onDelete(id: string) {
    if (!confirm("Excluir esta atividade?")) return;
    await deleteActivity(id);
  }

  const filtered = (activities ?? []).filter(
    (a) =>
      (!fType || a.type === fType) &&
      (!fSubject || a.subjectId === fSubject)
  );
  const listFiltered = filtered.filter((a) => !fStatus || a.status === fStatus);

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-[var(--color-border)] p-0.5">
          <ViewBtn active={view === "list"} onClick={() => setView("list")} icon={ListIcon} label="Lista" />
          <ViewBtn active={view === "kanban"} onClick={() => setView("kanban")} icon={KanbanSquare} label="Kanban" />
        </div>

        <select className={selectCls} value={fType} onChange={(e) => setFType(e.target.value as ActivityType | "")}>
          <option value="">Todos os tipos</option>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>

        <select className={selectCls} value={fSubject} onChange={(e) => setFSubject(e.target.value)}>
          <option value="">Todas as matérias</option>
          {(subjects ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {view === "list" && (
          <select className={selectCls} value={fStatus} onChange={(e) => setFStatus(e.target.value as ActivityStatus | "")}>
            <option value="">Todos os status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        )}
      </div>

      {loading || !activities ? (
        <p className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
          Carregando…
        </p>
      ) : activities.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-secondary)]">
              <CalendarClock className="size-5 text-[var(--color-muted-foreground)]" />
            </div>
            <h2 className="text-lg font-semibold">Nenhuma atividade ainda</h2>
            <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
              Crie atividades, redações, trabalhos e exercícios. Defina um prazo
              e ele aparece no Calendário.
            </p>
          </div>
        </Card>
      ) : view === "list" ? (
        <ListView items={listFiltered} onOpen={open} onDelete={onDelete} />
      ) : (
        <KanbanView items={filtered} onOpen={open} />
      )}
    </div>
  );
}

function ViewBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
          : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

function TypeBadge({ type }: { type: ActivityType }) {
  const c = TYPE_COLORS[type];
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", c.bg, c.text)}>
      {TYPE_LABELS[type]}
    </span>
  );
}

function Meta({ a }: { a: ActivityListItem }) {
  const due = formatDue(a.dueDate);
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-muted-foreground)]">
      {a.subjectName && (
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full" style={{ background: a.subjectColor ?? "#888" }} />
          {a.subjectName}
        </span>
      )}
      {due && (
        <span className={cn("flex items-center gap-1", isOverdue(a) && "text-rose-300")}>
          <CalendarClock className="size-3" />
          {due}
        </span>
      )}
      {a.grade != null && (
        <span className="text-emerald-300">
          {a.grade}{a.maxGrade != null ? `/${a.maxGrade}` : ""}
        </span>
      )}
    </div>
  );
}

// ── Lista ──────────────────────────────────────────────────────────────────
function ListView({
  items,
  onOpen,
  onDelete,
}: {
  items: ActivityListItem[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0)
    return <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">Nada com esses filtros.</p>;
  return (
    <div className="space-y-2">
      {items.map((a) => (
        <Card
          key={a.id}
          onClick={() => onOpen(a.id)}
          className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-[var(--color-accent)]"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <TypeBadge type={a.type} />
              <span className={cn("truncate text-sm font-medium", a.status === "DONE" && "line-through opacity-60")}>
                {a.title}
              </span>
            </div>
            <div className="mt-1">
              <Meta a={a} />
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--color-secondary)] px-2 py-0.5 text-[10px] text-[var(--color-muted-foreground)]">
            {STATUS_LABELS[a.status]}
          </span>
          <button
            type="button"
            aria-label="Excluir"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(a.id);
            }}
            className="shrink-0 rounded-md p-2 text-[var(--color-muted-foreground)] transition-colors hover:text-rose-300"
          >
            <Trash2 className="size-4" />
          </button>
        </Card>
      ))}
    </div>
  );
}

// ── Kanban ───────────────────────────────────────────────────────────────────
function KanbanView({
  items,
  onOpen,
}: {
  items: ActivityListItem[];
  onOpen: (id: string) => void;
}) {
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [over, setOver] = React.useState<ActivityStatus | null>(null);

  async function drop(status: ActivityStatus) {
    setOver(null);
    const id = dragId;
    setDragId(null);
    if (id) await setActivityStatus(id, status);
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {STATUSES.map((status) => {
        const col = items.filter((a) => a.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(status);
            }}
            onDragLeave={() => setOver((o) => (o === status ? null : o))}
            onDrop={() => void drop(status)}
            className={cn(
              "flex min-h-[120px] flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/50 p-2 transition-colors",
              over === status && "border-[var(--color-ring)] bg-[var(--color-accent)]"
            )}
          >
            <div className="flex items-center justify-between px-1 py-0.5 text-xs font-semibold">
              <span>{STATUS_LABELS[status]}</span>
              <span className="text-[var(--color-muted-foreground)]">{col.length}</span>
            </div>
            {col.map((a) => (
              <div
                key={a.id}
                draggable
                onDragStart={() => setDragId(a.id)}
                onDragEnd={() => setDragId(null)}
                onClick={() => onOpen(a.id)}
                className="cursor-pointer rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-2.5 shadow-sm transition-colors hover:bg-[var(--color-accent)]"
              >
                <div className="flex items-center gap-1.5">
                  <TypeBadge type={a.type} />
                </div>
                <p className={cn("mt-1.5 text-sm font-medium", a.status === "DONE" && "line-through opacity-60")}>
                  {a.title}
                </p>
                <div className="mt-1.5">
                  <Meta a={a} />
                </div>
              </div>
            ))}
            {col.length === 0 && (
              <p className="px-1 py-4 text-center text-[11px] text-[var(--color-muted-foreground)]">
                Arraste para cá
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
