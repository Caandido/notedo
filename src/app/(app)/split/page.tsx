"use client";

import { Header } from "@/components/layout/header";
import { SplitView } from "@/components/split/split-view";

export default function SplitPage() {
  return (
    <div className="flex h-full flex-col">
      <Header
        title="Tela dividida"
        subtitle="Abra mais de uma matéria lado a lado"
      />
      <SplitView />
    </div>
  );
}
