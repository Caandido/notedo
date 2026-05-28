"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { PieChart as PieIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SubjectChartProps {
  data: { id: string; name: string; color: string; hours: number }[];
}

const Impl = dynamic(() => import("./subject-chart-impl").then((m) => m.Impl), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full animate-pulse rounded-md bg-[var(--color-secondary)]/40" />
  ),
});

export function SubjectChart({ data }: SubjectChartProps) {
  const total = data.reduce((a, s) => a + s.hours, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm">
            <PieIcon className="size-4 text-[var(--color-muted-foreground)]" />
            Horas por matéria
          </CardTitle>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Distribuição do tempo estudado
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
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-[var(--color-muted-foreground)]">
            Sem dados no período
          </div>
        ) : (
          <Impl data={data} />
        )}
      </CardContent>
    </Card>
  );
}
