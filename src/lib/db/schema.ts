/**
 * Metadados de sincronização presentes em TODAS as linhas.
 * - updatedAt: ms epoch; base do last-write-wins.
 * - _dirty: 1 = mudança local ainda não enviada ao servidor.
 * - trashedAt: ms epoch em que foi mandado pra Lixeira (null = item vivo).
 *   Itens na lixeira são filtrados dos reads de listagem e, após 12 dias (ou
 *   "excluir definitivo"), viram hard-delete local + `_tombstones` (delete real
 *   que propaga). Itens de uma mesma ação em cascata compartilham o mesmo
 *   `trashedAt` (ms exato) — serve de chave de agrupamento na UI da Lixeira.
 * O prefixo "_" marca campos locais que nunca vão crus ao Supabase (ver mappers).
 */
export type SyncMeta = {
  updatedAt: number;
  _dirty: 0 | 1;
  trashedAt?: number | null;
};

export type LocalUser = SyncMeta & {
  id: string;
  name: string;
  email?: string;
  image?: string;
  createdAt: number;
};

export type SubjectRow = SyncMeta & {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  progress: number;
  tags: string[];
  archived: boolean;
  /** Meta de nota (média alvo, escala 0–10). null = sem meta. */
  gradeTarget?: number | null;
  /**
   * Peso total do período (soma dos pesos de TODAS as avaliações, inclusive as
   * que ainda não foram lançadas). Com ele, o app calcula a média necessária no
   * peso restante pra bater a meta. null = desconhecido (só compara média atual).
   */
  gradeTotalWeight?: number | null;
  createdAt: number;
};

export type TopicRow = SyncMeta & {
  id: string;
  userId: string;
  subjectId: string;
  parentId: string | null;
  title: string;
  content: unknown;
  order: number;
  createdAt: number;
};

export type StudySessionRow = SyncMeta & {
  id: string;
  userId: string;
  subjectId: string | null;
  topicId: string | null;
  mode: "POMODORO" | "FREE" | "REVERSE" | "CUSTOM";
  startedAt: number;
  endedAt: number | null;
  durationSeconds: number;
  notes?: string | null;
  focusScore?: number | null;
  createdAt: number;
};

export type GoalRow = SyncMeta & {
  id: string;
  userId: string;
  type: "DAILY" | "WEEKLY" | "MONTHLY";
  metric: "HOURS" | "TASKS" | "SESSIONS" | "REVIEWS";
  target: number;
  label: string;
  active: boolean;
  createdAt: number;
};

export type ReviewRow = SyncMeta & {
  id: string;
  userId: string;
  subjectId: string | null;
  title: string;
  scheduledAt: number;
  completedAt: number | null;
  interval: number;
  ease: number;
  status: "PENDING" | "COMPLETED" | "SKIPPED";
  createdAt: number;
};

export type FlashcardRow = SyncMeta & {
  id: string;
  userId: string;
  front: string;
  back: string;
  deck: string | null;
  ease: number;
  interval: number;
  nextReview: number;
  createdAt: number;
};

export type CalendarEventRow = SyncMeta & {
  id: string;
  userId: string;
  subjectId: string | null;
  type: "EXAM" | "TASK" | "CLASS" | "CUSTOM";
  title: string;
  notes: string | null;
  date: number;
  done: boolean;
  createdAt: number;
};

export type GradeRow = SyncMeta & {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  type: "EXAM" | "ASSIGNMENT" | "QUIZ" | "OTHER";
  score: number;
  maxScore: number;
  weight: number;
  date: number;
  comments: string | null;
  createdAt: number;
};

/**
 * Mapa mental. A estrutura (nós/arestas) vive em `data` (JSON sincronizado).
 * Slides importados (Canva) guardam só o caminho da imagem no Storage + dims;
 * o binário fica em `_blobs` (cache local) e no bucket `mindmap-slides`.
 */
export type MindMapShape = "rect" | "ellipse" | "diamond";

export type MindMapNode = {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  /**
   * "text"   = nó simples (textarea);
   * "slide"  = imagem (slide importado do Canva/PDF OU upload solto) no Storage;
   * "rich"   = conteúdo rico (TipTap: tabelas, fórmulas, links, imagem por URL);
   * "sticky" = post-it colorido com texto;
   * "shape"  = forma (retângulo/elipse/losango) com texto e cor;
   * "frame"  = moldura/seção pra agrupar visualmente (fica atrás);
   * "draw"   = traço à mão livre (SVG path).
   */
  kind: "text" | "slide" | "rich" | "sticky" | "shape" | "frame" | "draw";
  text?: string;
  color?: string | null;
  /** Cor de borda/traço (shape/frame). */
  stroke?: string | null;
  /** Presente quando kind === "shape". */
  shape?: MindMapShape;
  /** Presente quando kind === "slide". path = chave no bucket/_blobs. */
  slide?: { path: string; w: number; h: number } | null;
  /** Presente quando kind === "rich". JSON do TipTap. */
  content?: unknown;
  /**
   * Presente quando kind === "draw". d = path SVG relativo à caixa (w×h)
   * de criação; o nó escala via viewBox fixo (w,h).
   */
  draw?: { d: string; stroke: string; width: number; w: number; h: number } | null;
};

export type MindMapEdge = {
  id: string;
  source: string;
  target: string;
  /** Estilo da linha. */
  variant?: "default" | "straight" | "smoothstep";
  label?: string;
  color?: string | null;
  /** Ponta de seta no destino (default true). */
  arrow?: boolean;
};

export type MindMapData = {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
};

export type MindMapRow = SyncMeta & {
  id: string;
  userId: string;
  subjectId: string | null;
  title: string;
  data: MindMapData;
  /**
   * Código de convite (token) pra colaboração. Quando preenchido, o mapa pode
   * ser aberto por quem tiver o código (via RPC join_mindmap_by_token). null =
   * não compartilhado. Só o dono define/limpa.
   */
  shareToken?: string | null;
  createdAt: number;
};

/**
 * Registro LOCAL (não sincroniza pelo motor) de mapas compartilhados COMIGO —
 * mapas cujo dono é outra pessoa e em que entrei como colaborador. Serve pra
 * listá-los junto dos meus (a linha do mapa em si tem o userId do dono).
 */
export type MindmapShareRow = {
  mapId: string;
  role: string;
  ownerName?: string | null;
  joinedAt: number;
};

export type ActivityType =
  | "ATIVIDADE"
  | "REDACAO"
  | "TRABALHO"
  | "EXERCICIO"
  | "PROVA";
export type ActivityStatus = "TODO" | "DOING" | "DONE";

/**
 * Atividade / redação / trabalho. Corpo em texto rico (`content`, TipTap JSON)
 * pra escrever redações com imagens/tabelas/fórmulas. Com `dueDate` definido,
 * um evento-espelho é mantido na tabela `events` (aparece no Calendário).
 */
export type ActivityRow = SyncMeta & {
  id: string;
  userId: string;
  subjectId: string | null;
  type: ActivityType;
  status: ActivityStatus;
  title: string;
  content: unknown;
  dueDate: number | null;
  grade: number | null;
  maxGrade: number | null;
  /** ordem dentro da coluna do kanban. */
  order: number;
  createdAt: number;
};

/**
 * Quadro Kanban de projetos (uso "trabalho/dev", separado das matérias).
 * As colunas vivem em `columns` (JSON sincronizado) pra serem editáveis por
 * quadro (criar/renomear/reordenar). Cada card referencia uma `columnId`.
 */
export type BoardColumn = {
  id: string;
  name: string;
};

export type BoardRow = SyncMeta & {
  id: string;
  userId: string;
  name: string;
  color: string;
  columns: BoardColumn[];
  /** ordem do projeto na lista lateral. */
  order: number;
  createdAt: number;
};

export type CardPriority = "NONE" | "LOW" | "MEDIUM" | "HIGH";

/**
 * Card de um quadro. Corpo em texto rico (`content`, TipTap JSON) — mesmo editor
 * das matérias. `columnId` aponta pra uma coluna do board; `order` é a posição
 * dentro da coluna (renumerada sequencialmente a cada move).
 */
export type CardRow = SyncMeta & {
  id: string;
  userId: string;
  boardId: string;
  columnId: string;
  title: string;
  content: unknown;
  labels: string[];
  priority: CardPriority;
  /** Cor própria do card (acento). null = herda a cor do quadro. */
  color: string | null;
  dueDate: number | null;
  order: number;
  createdAt: number;
};

/**
 * Bloco de notas: anotações rápidas/soltas, independentes de matérias e projetos.
 * Corpo em texto rico (`content`, TipTap JSON). `pinned` fixa no topo; `color`
 * é um acento opcional do card.
 */
export type NoteRow = SyncMeta & {
  id: string;
  userId: string;
  title: string;
  content: unknown;
  pinned: boolean;
  color: string | null;
  createdAt: number;
};

/**
 * Lousa (quadro livre estilo paint) pra resolver exercícios. O conteúdo é uma
 * lista de elementos vetoriais em `data` (JSON sincronizado). Canvas infinito
 * com caneta, formas, texto, equações (KaTeX) e imagens.
 */
export type LousaPoint = [number, number];

export type LousaElement =
  | { id: string; t: "stroke"; pts: LousaPoint[]; color: string; w: number }
  | {
      id: string;
      t: "line" | "arrow" | "rect" | "ellipse";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      w: number;
    }
  | { id: string; t: "text"; x: number; y: number; text: string; color: string; size: number }
  | { id: string; t: "math"; x: number; y: number; latex: string; size: number }
  | { id: string; t: "image"; x: number; y: number; w: number; h: number; src: string };

export type LousaData = { elements: LousaElement[] };

export type LousaRow = SyncMeta & {
  id: string;
  userId: string;
  title: string;
  data: LousaData;
  createdAt: number;
};

/**
 * Cache local de binários (slides). NÃO sincroniza pelo motor de tabelas —
 * o transporte é o Supabase Storage (ver lib/sync/storage.ts). key = path.
 */
export type BlobRow = {
  path: string;
  blob: Blob;
  /** 1 = ainda não enviado ao Storage (upload pendente). */
  _dirty: 0 | 1;
};

/** Watermark de pull por tabela (maior updated_at já trazido do servidor, em ms). */
export type SyncStateRow = {
  table: string;
  pulledThrough: number;
};

/**
 * Lápide de exclusão. Delete = hard-delete local da linha + um registro aqui.
 * O push faz UPDATE ... SET deleted_at no servidor (0 linhas se nunca sincronizou).
 * key = `${table}:${rowId}` (PK).
 */
export type TombstoneRow = {
  key: string;
  table: SyncTableName;
  rowId: string;
  userId: string;
  deletedAt: number;
  _dirty: 0 | 1;
};

/** Nomes das tabelas de dados sincronizáveis (ordem de sync: pais antes de filhos). */
export const SYNC_TABLES = [
  "users",
  "subjects",
  "topics",
  "sessions",
  "goals",
  "reviews",
  "flashcards",
  "events",
  "grades",
  "mindmaps",
  "activities",
  "boards",
  "cards",
  "notes",
  "canvases",
] as const;

export type SyncTableName = (typeof SYNC_TABLES)[number];
