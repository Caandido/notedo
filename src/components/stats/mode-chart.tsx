"use client";

import * as React from "react";
import { Timer as TimerIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ModeChartProps {
  data: {
    mode: string;
    label: string;
    color: string;
    hours: number;
    sessions: number;
  }[];
}

export function ModeChart({ data }: ModeChartProps) {
  const total = data.reduce((a, m) => a + m.hours, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <TimerIcon className="size-4 text-[var(--color-muted-foreground)]" />
          Modos de estudo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">
            Sem dados no período
          </p>
        ) : (
          <>
            <div className="flex h-2 w-full overflow-hidden rounded-full">
              {data.map((m) => {
                const pct = total > 0 ? (m.hours / total) * 100 : 0;
                return (
                  <div
                    key={m.mode}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: m.color,
                    }}
                    title={`${m.label}: ${m.hours.toFixed(1)}h`}
                  />
                );
              })}
            </div>
            <ul className="space-y-1.5 pt-2">
              {data.map((m) => {
                const pct = total > 0 ? (m.hours / total) * 100 : 0;
                return (
                  <li
                    key={m.mode}
                    className="flex items-center gap-3 text-xs"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: m.color }}
                    />
                    <span className="min-w-0 flex-1 font-medium">
                      {m.label}
                    </span>
                    <span className="tabular-nums text-[var(--color-muted-foreground)]">
                      {m.hours.toFixed(1)}h · {m.sessions} sessões
                    </span>
                    <span className="w-10 text-right tabular-nums text-[var(--color-muted-foreground)]">
                      {pct.toFixed(0)}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
