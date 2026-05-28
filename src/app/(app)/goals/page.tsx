import { Target } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { NewGoalForm } from "@/components/goals/new-goal-form";
import { GoalRow } from "@/components/goals/goal-row";
import { getGoalsWithProgress } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const goals = await getGoalsWithProgress();
  const active = goals.filter((g) => g.active);
  const paused = goals.filter((g) => !g.active);
  const completed = active.filter((g) => g.progress >= 100).length;

  return (
    <>
      <Header
        title="Metas"
        subtitle={
          goals.length === 0
            ? "Defina metas para manter o ritmo"
            : `${active.length} ativa${active.length === 1 ? "" : "s"} · ${completed} concluída${completed === 1 ? "" : "s"}`
        }
      />
      <div className="space-y-4 p-6">
        <NewGoalForm />

        {goals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-secondary)]">
                <Target className="size-5 text-[var(--color-muted-foreground)]" />
              </div>
              <h2 className="text-lg font-semibold">Nenhuma meta ainda</h2>
              <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
                Crie metas diárias, semanais ou mensais para acompanhar seu progresso.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {active.map((g) => (
              <GoalRow key={g.id} goal={g} />
            ))}
            {paused.length > 0 && (
              <>
                <p className="pt-3 text-xs font-medium text-[var(--color-muted-foreground)]">
                  Pausadas
                </p>
                {paused.map((g) => (
                  <GoalRow key={g.id} goal={g} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
