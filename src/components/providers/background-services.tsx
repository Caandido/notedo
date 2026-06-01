"use client";

import * as React from "react";

import { invalidateAll, subscribeInvalidate } from "@/lib/db/use-repo";

/**
 * Serviços de fundo que rodam enquanto o usuário está logado:
 * - purga da Lixeira (apaga o que passou de 12 dias) no startup e 1x/dia;
 * - notificações de provas/atividades (agenda no Android; dispara em foreground
 *   no PC/web) — reagendadas no startup e sempre que os dados mudam (debounce).
 * Não renderiza nada.
 */
export function BackgroundServices() {
  React.useEffect(() => {
    let cancelled = false;
    let debounce: ReturnType<typeof setTimeout> | null = null;

    async function runPurge() {
      try {
        const { purgeExpiredTrash } = await import("@/lib/trash/purge");
        const n = await purgeExpiredTrash();
        if (!cancelled && n > 0) invalidateAll();
      } catch {
        /* offline / sem sessão: ignora */
      }
    }

    async function reschedule() {
      try {
        const { rescheduleAll } = await import("@/lib/notify");
        await rescheduleAll();
      } catch {
        /* ignora */
      }
    }

    async function publishWidget() {
      try {
        const { publishWidgetData } = await import("@/lib/widget/publish");
        await publishWidgetData();
      } catch {
        /* ignora */
      }
    }

    // Startup
    void runPurge();
    void publishWidget();
    void (async () => {
      const { startNotifications } = await import("@/lib/notify");
      startNotifications();
    })();

    // Purga diária
    const purgeInterval = setInterval(() => void runPurge(), 24 * 60 * 60 * 1000);

    // Reagenda notificações + atualiza o widget quando os dados mudam.
    const onChange = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        void reschedule();
        void publishWidget();
      }, 2000);
    };
    // useRepoQuery usa o mesmo registry; reusamos o subscribe leve.
    const unsub = subscribeInvalidate(onChange);

    return () => {
      cancelled = true;
      clearInterval(purgeInterval);
      if (debounce) clearTimeout(debounce);
      unsub();
      void (async () => {
        const { stopNotifications } = await import("@/lib/notify");
        stopNotifications();
      })();
    };
  }, []);

  return null;
}
