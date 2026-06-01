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

  // `fn` é recriada a cada render; guardamos a última numa ref pra os efeitos
  // sempre chamarem a versão atual sem precisar entrar nas suas deps.
  const fnRef = React.useRef(fn);
  fnRef.current = fn;

  // Carga inicial e troca de deps (ex.: outro tópico): aí SIM mostramos loading
  // e limpamos os dados antigos — é uma navegação genuína pra outro recurso.
  React.useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    fnRef.current()
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
  }, deps);

  // Invalidação de fundo (toda mutação chama invalidateAll — inclusive o autosave
  // do editor). Aqui fazemos um refetch SILENCIOSO: mantemos os dados atuais e NÃO
  // ligamos `loading`, senão telas que fazem `if (loading) return <Loading/>`
  // desmontariam o conteúdo a cada save — o editor piscava e perdia o foco.
  const mountVersion = React.useRef(version);
  React.useEffect(() => {
    if (mountVersion.current === version) return; // ignora o disparo de montagem
    let cancelled = false;
    fnRef.current()
      .then((data) => {
        if (cancelled) return;
        setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState((s) => ({ ...s, error: err.message }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  return state;
}
