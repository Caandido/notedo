"use client";

import * as React from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase, hasSupabaseConfig } from "@/lib/sync/client";
import type { MindMapData } from "@/lib/db/schema";

const PALETTE = [
  "#f43f5e", "#3b82f6", "#22c55e", "#a855f7",
  "#f59e0b", "#06b6d4", "#ec4899", "#84cc16",
];

/** Cor estável por usuário (hash do id). */
export function colorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export type Peer = {
  id: string;
  name: string;
  color: string;
  x: number | null;
  y: number | null;
};

/**
 * Colaboração em tempo real num mapa via Supabase Realtime:
 * - presença = quem está no mapa agora (roster pra avatares);
 * - broadcast "cursor" = posição do ponteiro (em coords do flow) dos outros;
 * - broadcast "doc" = estrutura completa do mapa quando alguém edita.
 *
 * É uma camada de LIVENESS por cima do sync (que persiste de verdade, com LWW).
 * Não é CRDT — em edição muito simultânea pode haver "última escrita vence".
 */
export function useMindmapCollab(opts: {
  mapId: string;
  enabled: boolean;
  selfId: string;
  selfName: string;
  onRemoteDoc: (data: MindMapData) => void;
}) {
  const { mapId, enabled, selfId, selfName, onRemoteDoc } = opts;
  const [peers, setPeers] = React.useState<Peer[]>([]);

  const channelRef = React.useRef<RealtimeChannel | null>(null);
  const onDocRef = React.useRef(onRemoteDoc);
  onDocRef.current = onRemoteDoc;
  const cursorsRef = React.useRef<Map<string, { x: number; y: number }>>(new Map());
  const rosterRef = React.useRef<Map<string, { name: string; color: string }>>(new Map());
  const lastCursorSent = React.useRef(0);

  const selfColor = React.useMemo(() => colorFor(selfId), [selfId]);

  const rebuild = React.useCallback(() => {
    const out: Peer[] = [];
    rosterRef.current.forEach((r, id) => {
      if (id === selfId) return;
      const c = cursorsRef.current.get(id);
      out.push({ id, name: r.name, color: r.color, x: c?.x ?? null, y: c?.y ?? null });
    });
    setPeers(out);
  }, [selfId]);

  React.useEffect(() => {
    if (!enabled || !hasSupabaseConfig() || typeof window === "undefined") return;

    const channel = supabase().channel(`mindmap:${mapId}`, {
      config: { broadcast: { self: false }, presence: { key: selfId } },
    });
    channelRef.current = channel;

    channel.on("broadcast", { event: "doc" }, ({ payload }) => {
      const p = payload as { from?: string; data?: MindMapData } | undefined;
      if (!p || p.from === selfId || !p.data) return;
      onDocRef.current(p.data);
    });
    channel.on("broadcast", { event: "cursor" }, ({ payload }) => {
      const p = payload as { from?: string; x?: number; y?: number } | undefined;
      if (!p || !p.from || p.from === selfId) return;
      cursorsRef.current.set(p.from, { x: p.x ?? 0, y: p.y ?? 0 });
      rebuild();
    });
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<
        string,
        Array<{ id?: string; name?: string; color?: string }>
      >;
      const roster = new Map<string, { name: string; color: string }>();
      Object.values(state).forEach((metas) => {
        const m = metas[0];
        if (m?.id) roster.set(m.id, { name: m.name ?? "Colaborador", color: m.color ?? "#888" });
      });
      rosterRef.current = roster;
      for (const k of Array.from(cursorsRef.current.keys()))
        if (!roster.has(k)) cursorsRef.current.delete(k);
      rebuild();
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        void channel.track({ id: selfId, name: selfName, color: selfColor });
      }
    });

    return () => {
      try {
        void channel.unsubscribe();
      } catch {
        /* noop */
      }
      try {
        supabase().removeChannel(channel);
      } catch {
        /* noop */
      }
      channelRef.current = null;
      cursorsRef.current.clear();
      rosterRef.current.clear();
      setPeers([]);
    };
  }, [enabled, mapId, selfId, selfName, selfColor, rebuild]);

  const sendCursor = React.useCallback(
    (x: number, y: number) => {
      const ch = channelRef.current;
      if (!ch) return;
      const now = Date.now();
      if (now - lastCursorSent.current < 45) return;
      lastCursorSent.current = now;
      void ch.send({ type: "broadcast", event: "cursor", payload: { from: selfId, x, y } });
    },
    [selfId]
  );

  const sendDoc = React.useCallback(
    (data: MindMapData) => {
      const ch = channelRef.current;
      if (!ch) return;
      void ch.send({ type: "broadcast", event: "doc", payload: { from: selfId, data } });
    },
    [selfId]
  );

  return { peers, sendCursor, sendDoc, selfColor };
}
