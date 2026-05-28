"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WritingCardProps {
  data: {
    label: string;
    edits: number;
  }[];
  totals: {
    totalTopics: number;
    topicsWithContent: number;
    topicsTouched: number;
  };
}

const Impl = dynamic(() => import("./writing-card-impl").then((m) => m.Impl), {
  ssr: false,
  loading: () => (
    <div className="h-32 w-full animate-pulse rounded-md bg-[var(--color-secondary)]/40" />
  ),
});

export function WritingCard({ data, totals }: WritingCardProps) {
  const totalEdits = data.reduce((a, d) => a + d.edits, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-[var(--color-muted-foreground)]" />
            Conteúdo criado
          </CardTitle>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Edições por dia
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Edições no período
          </p>
          <p className="text-lg font-semibold tabular-nums">{totalEdits}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Impl data={data} />

        <div className="grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-3 text-xs">
          <div>
            <p className="text-[var(--color-muted-foreground)]">Tópicos totais</p>
            <p className="font-medium tabular-nums">{totals.totalTopics}</p>
          </div>
          <div>
            <p className="text-[var(--color-muted-foreground)]">Com conteúdo</p>
            <p className="font-medium tabular-nums">{totals.topicsWithContent}</p>
          </div>
          <div>
            <p className="text-[var(--color-muted-foreground)]">Editados no período</p>
            <p className="font-medium tabular-nums">{totals.topicsTouched}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
