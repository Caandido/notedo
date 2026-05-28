"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DayHeatmapEntry } from "@/types";

interface HeatmapProps {
  data: DayHeatmapEntry[];
}

function intensity(seconds: number): number {
  const h = seconds / 3600;
  if (h === 0) return 0;
  if (h < 0.5) return 1;
  if (h < 1.5) return 2;
  if (h < 3) return 3;
  return 4;
}

const intensityClass: Record<number, string> = {
  0: "bg-[var(--color-secondary)]",
  1: "bg-[var(--color-chart-1)]/25",
  2: "bg-[var(--color-chart-1)]/45",
  3: "bg-[var(--color-chart-1)]/70",
  4: "bg-[var(--color-chart-1)]",
};

export function Heatmap({ data }: HeatmapProps) {
  const totalDays = data.length;
  const cols = Math.ceil(totalDays / 7);
  const grid: (DayHeatmapEntry | null)[][] = Array.from({ length: 7 }, () =>
    Array(cols).fill(null)
  );

  data.forEach((entry, idx) => {
    const col = Math.floor(idx / 7);
    const row = idx % 7;
    grid[row][col] = entry;
  });

  const totalHours = data.reduce((acc, d) => acc + d.seconds / 3600, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm">
            <CalendarDays className="size-4 text-[var(--color-muted-foreground)]" />
            Constância
          </CardTitle>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Últimos 90 dias · {totalHours.toFixed(0)}h total
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-muted-foreground)]">
          <span>menos</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={`size-2.5 rounded-sm ${intensityClass[level]}`}
            />
          ))}
          <span>mais</span>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="grid gap-1"
          style={{
            gridTemplateRows: "repeat(7, minmax(0, 1fr))",
            gridAutoFlow: "column",
            gridAutoColumns: "minmax(0, 1fr)",
          }}
        >
          {grid.flatMap((row, rIdx) =>
            row.map((cell, cIdx) =>
              cell ? (
                <div
                  key={`${rIdx}-${cIdx}`}
                  title={`${cell.date} · ${(cell.seconds / 3600).toFixed(1)}h`}
                  className={`aspect-square rounded-sm transition-transform hover:scale-110 ${intensityClass[intensity(cell.seconds)]}`}
                />
              ) : (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className="aspect-square rounded-sm opacity-0"
                />
              )
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
