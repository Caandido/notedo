"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeekdayChartProps {
  data: { label: string; hours: number }[];
}

const Impl = dynamic(() => import("./weekday-chart-impl").then((m) => m.Impl), {
  ssr: false,
  loading: () => (
    <div className="h-56 w-full animate-pulse rounded-md bg-[var(--color-secondary)]/40" />
  ),
});

export function WeekdayChart({ data }: WeekdayChartProps) {
  const best = data.reduce((acc, d) => (d.hours > acc.hours ? d : acc), {
    label: "—",
    hours: 0,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="size-4 text-[var(--color-muted-foreground)]" />
            Por dia da semana
          </CardTitle>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Quando você mais estuda
          </p>
        </div>
        {best.hours > 0 && (
          <div className="text-right">
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Melhor dia
            </p>
            <p className="text-sm font-semibold">{best.label}</p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Impl data={data} />
      </CardContent>
    </Card>
  );
}
