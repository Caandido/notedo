"use client";

import * as React from "react";

type QueryState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

let invalidateCounter = 0;
const listeners = new Set<() => void>();

export function invalidateAll() {
  invalidateCounter += 1;
  listeners.forEach((l) => l());
}

/**
 * Assina o sinal de invalidação (toda mutação chama invalidateAll). Usado por
 * serviços de fundo (notificações, widget) pra reagir a mudanças de dados.
 * Retorna a função de cancelamento.
 */
export function subscribeInvalidate(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function useInvalidationVersion() {
  const [v, setV] = React.useState(invalidateCounter);
  React.useEffect(() => {
    const fn = () => setV(invalidateCounter);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return v;
}

export function useRepoQuery<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList = []
): QueryState<T> {
  const version = useInvalidationVersion();
  const [state, setState] = React.useState<QueryState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  React.useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => {
        if (cancelled) return;
        setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({ data: null, loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);

  return state;
}
