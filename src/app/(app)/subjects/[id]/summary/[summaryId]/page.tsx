import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { SummaryEditor } from "@/components/summaries/summary-editor";
import { getSummaryById } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface SummaryPageProps {
  params: Promise<{ id: string; summaryId: string }>;
}

export default async function SummaryPage({ params }: SummaryPageProps) {
  const { id, summaryId } = await params;
  const summary = await getSummaryById(summaryId);
  if (!summary || summary.subjectId !== id) notFound();

  const updatedAt = new Date(summary.updatedAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <Header
        title={summary.title}
        subtitle={`${summary.subject.name} · atualizado ${updatedAt}`}
      />
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 h-7">
            <Link href="/subjects">
              <ArrowLeft className="size-3.5" />
              Matérias
            </Link>
          </Button>
          <ChevronRight className="size-3" />
          <Link
            href={`/subjects/${summary.subjectId}`}
            className="rounded px-1.5 py-0.5 transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
          >
            {summary.subject.name}
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-[var(--color-foreground)]">{summary.title}</span>
        </div>

        <SummaryEditor
          summaryId={summary.id}
          initialTitle={summary.title}
          initialContent={summary.content}
        />
      </div>
    </>
  );
}
