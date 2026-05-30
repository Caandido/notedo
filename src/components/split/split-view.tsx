"use client";

import * as React from "react";
import { Columns2, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getSubjectsForUser } from "@/lib/queries";
import { SubjectPanel } from "@/components/split/subject-panel";

const STORAGE_KEY = "notedo:split:subjects";
const MAX_PANELS = 3;

let panelSeq = 0;
function newPanelId() {
  panelSeq += 1;
  return `p${panelSeq}`;
}

interface Panel {
  id: string;
  subjectId: string | null;
  openTopicId: string | null;
}

function loadStored(): (string | null)[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.slice(0, MAX_PANELS);
  } catch {
    /* ignora */
  }
  return null;
}

export function SplitView() {
  const { data: subjects, loading } = useRepoQuery(
    () => getSubjectsForUser(),
    []
  );

  const [panels, setPanels] = React.useState<Panel[]>([]);
  const initialized = React.useRef(false);

  // inicializa os painéis uma vez, quando as matérias carregam
  React.useEffect(() => {
    if (initialized.current || !subjects) return;
    initialized.current = true;

    const stored = loadStored();
    if (stored && stored.length > 0) {
      setPanels(
        stored.map((sid) => ({
          id: newPanelId(),
          subjectId: sid && subjects.some((s) => s.id === sid) ? sid : null,
          openTopicId: null,
        }))
      );
      return;
    }
    // padrão: 2 painéis, pré-preenchidos com as 2 matérias mais recentes
    setPanels([
      { id: newPanelId(), subjectId: subjects[0]?.id ?? null, openTopicId: null },
      {
        id: newPanelId(),
        subjectId: subjects[1]?.id ?? subjects[0]?.id ?? null,
        openTopicId: null,
      },
    ]);
  }, [subjects]);

  // persiste a seleção
  React.useEffect(() => {
    if (!initialized.current) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(panels.map((p) => p.subjectId))
      );
    } catch {
      /* ignora */
    }
  }, [panels]);

  function setPanelSubject(panelId: string, subjectId: string) {
    // trocar de matéria fecha o tópico aberto naquele painel
    setPanels((prev) =>
      prev.map((p) =>
        p.id === panelId ? { ...p, subjectId, openTopicId: null } : p
      )
    );
  }
  function setPanelTopic(panelId: string, openTopicId: string | null) {
    setPanels((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, openTopicId } : p))
    );
  }
  function addPanel() {
    setPanels((prev) =>
      prev.length >= MAX_PANELS
        ? prev
        : [...prev, { id: newPanelId(), subjectId: null, openTopicId: null }]
    );
  }
  function closePanel(panelId: string) {
    setPanels((prev) =>
      prev.length <= 1 ? prev : prev.filter((p) => p.id !== panelId)
    );
  }

  if (loading || !subjects) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-secondary)]">
          <Columns2 className="size-5 text-[var(--color-muted-foreground)]" />
        </div>
        <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
          Crie matérias primeiro para abrir mais de uma lado a lado aqui.
        </p>
      </div>
    );
  }

  const options = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }));
  const canAdd = panels.length < MAX_PANELS;
  const canClose = panels.length > 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-3 md:px-4">
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {panels.length} painé{panels.length === 1 ? "l" : "is"} · estude e edite
          mais de uma matéria ao mesmo tempo
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={addPanel}
          disabled={!canAdd}
          className="gap-1.5"
        >
          <Plus className="size-3.5" />
          Adicionar painel
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 md:flex-row md:px-4 md:pb-4">
        {panels.map((p) => (
          <div
            key={p.id}
            className="flex min-h-[60vh] min-w-0 flex-1 md:min-h-0"
          >
            <SubjectPanel
              subjects={options}
              subjectId={p.subjectId}
              openTopicId={p.openTopicId}
              onChangeSubject={(sid) => setPanelSubject(p.id, sid)}
              onOpenTopic={(tid) => setPanelTopic(p.id, tid)}
              onClose={canClose ? () => closePanel(p.id) : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
