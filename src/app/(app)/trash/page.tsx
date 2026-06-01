"use client";

import { Header } from "@/components/layout/header";
import { TrashView } from "@/components/trash/trash-view";

export default function TrashPage() {
  return (
    <div className="flex h-full flex-col">
      <Header title="Lixeira" subtitle="Itens excluídos (apagados após 12 dias)" />
      <TrashView />
    </div>
  );
}
