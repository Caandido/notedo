import { Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Goal } from "@/types";

interface GoalsCardProps {
  goals: Goal[];
}

const metricLabel: Record<Goal["metric"], string> = {
  hours: "h",
  sessions: "sessões",
  tasks: "tarefas",
  reviews: "revisões",
};

export function GoalsCard({ goals }: GoalsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Target className="size-4 text-[var(--color-muted-foreground)]" />
          Metas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const pct = Math.min(100, (goal.current / goal.target) * 100);
          return (
            <div key={goal.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--color-foreground)]">
                  {goal.label}
                </span>
                <span className="text-[var(--color-muted-foreground)]">
                  {goal.current.toLocaleString("pt-BR")} /{" "}
                  {goal.target.toLocaleString("pt-BR")} {metricLabel[goal.metric]}
                </span>
              </div>
              <Progress value={pct} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
