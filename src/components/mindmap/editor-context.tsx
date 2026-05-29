"use client";

import * as React from "react";

// Callbacks que os nós customizados usam pra mexer no estado do editor
// (sem precisar passar props pela árvore do React Flow).
type MindMapCtxValue = {
  updateNodeText: (id: string, text: string) => void;
  updateNodeColor: (id: string, color: string | null) => void;
  updateNodeContent: (id: string, content: unknown) => void;
};

export const MindMapCtx = React.createContext<MindMapCtxValue>({
  updateNodeText: () => {},
  updateNodeColor: () => {},
  updateNodeContent: () => {},
});

export const useMindMapCtx = () => React.useContext(MindMapCtx);
