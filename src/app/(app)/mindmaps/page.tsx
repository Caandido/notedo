"use client";

import { Network } from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageLoading } from "@/components/layout/page-loading";
import { Card, CardContent } from "@/components/ui/card";
import { NewMindMapForm } from "@/components/mindmap/new-mindmap-form";
import { JoinMindMapForm } from "@/components/mindmap/join-mindmap-form";
import { MindMapRowItem } from "@/components/mindmap/mindmap-row";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getMindMapsForUser } from "@/lib/queries";

export default function MindMapsPage() {
  const { data: maps, loading } = useRepoQuery(() => getMindMapsForUser(), []);
  if (loading || !maps) return <PageLoading />;

  const totalSlides = maps.reduce((acc, m) => acc + m.slideCount, 0);

  return (
    <>
      <Header
        title="Mapas mentais"
        subtitle={`${maps.length} mapa${maps.length === 1 ? "" : "s"}${
          totalSlides ? ` · ${totalSlides} slide${totalSlides === 1 ? "" : "s"}` : ""
        }`}
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2">
          <NewMindMapForm />
          <JoinMindMapForm />
        </div>

        {maps.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-secondary)]">
                <Network className="size-5 text-[var(--color-muted-foreground)]" />
              </div>
              <h2 className="text-lg font-semibold">Nenhum mapa ainda</h2>
              <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
                Crie um mapa mental para conectar ideias — e importe slides do
                Canva (PDF ou imagens) como nós visuais.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {maps.map((m) => (
              <MindMapRowItem key={m.id} map={m} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
