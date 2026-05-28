"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Activity } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const WeeklyChartImpl = dynamic(
  () => import("./weekly-chart-impl").then((m) => m.WeeklyChartImpl),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 w-full animate-pulse rounded-md bg-[var(--color-secondary)]/40" />
    ),
  }
);

interface WeeklyChartProps {
  data: { day: string; hours: number }[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const total = data.reduce((acc, d) => acc + d.hours, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="size-4 text-[var(--color-muted-foreground)]" />
            Últimos 7 dias
          </CardTitle>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Horas estudadas por dia
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--color-muted-foreground)]">Total</p>
          <p className="text-lg font-semibold tabular-nums">
            {total.toFixed(1)}h
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <WeeklyChartImpl data={data} />
      </CardContent>
    </Card>
  );
}
