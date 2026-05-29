"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createMindMap } from "@/features/mindmaps/actions";

export function NewMindMapForm() {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);

  async function create() {
    setCreating(true);
    const res = await createMindMap({ title: "Mapa sem título" });
    setCreating(false);
    if (res.ok) router.push(`/mindmap?id=${res.id}`);
  }

  return (
    <Button onClick={create} disabled={creating} className="gap-1.5">
      {creating ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Plus className="size-3.5" />
      )}
      Novo mapa
    </Button>
  );
}
