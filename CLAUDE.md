# CLAUDE.md

# VISÃO GERAL

Você está desenvolvendo um aplicativo moderno de auxílio aos estudos focado em:
- produtividade
- organização
- constância
- foco
- métricas de aprendizado

O sistema deve combinar:
- cronômetro de estudos
- rastreamento de horas
- organização de matérias
- metas
- estatísticas
- revisões
- IA integrada

Inspirar-se em:
- Notion
- TickTick
- Forest
- Pomofocus
- Linear
- Todoist

A experiência deve ser:
- rápida
- clean
- moderna
- intuitiva
- confortável
- minimalista

---

# STACK PRINCIPAL

## Frontend
- Next.js (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- Zustand
- Framer Motion
- TanStack Query
- Recharts

## Backend
- Supabase
OU
- PostgreSQL + Prisma

## Mobile
- Expo / React Native

## Infra
- Vercel
- Cloudflare
- S3 Storage

---

# FUNCIONALIDADES PRINCIPAIS

## Dashboard

Mostrar:
- horas estudadas hoje
- horas da semana
- streak
- metas
- matérias recentes
- sessões recentes
- calendário
- produtividade

---

## Cronômetro de Estudos

Modos:
- Pomodoro
- modo livre
- reverso
- sessões customizadas

Funcionalidades:
- iniciar/pausar
- histórico
- fullscreen focus mode
- música ambiente opcional
- pausas automáticas
- contagem total de horas

---

## Biblioteca de Matérias

Organizar:
- matérias
- tópicos
- anotações
- PDFs
- links
- vídeos
- resumos
- flashcards

Cada matéria deve possuir:
- cor personalizada
- progresso
- tempo estudado
- tags
- prioridade

---

## Sistema de Metas

Metas:
- diária
- semanal
- mensal

Metas incluem:
- horas estudadas
- tarefas concluídas
- sessões realizadas
- revisões feitas

---

## Sistema de Revisão

Implementar:
- repetição espaçada
- flashcards
- revisões automáticas
- calendário de revisão

---

## Estatísticas

Mostrar:
- horas totais
- produtividade
- média diária
- foco médio
- evolução semanal
- evolução mensal

Gráficos:
- linha
- barras
- heatmap
- calendário visual

---

## Sistema de IA

IA pode:
- gerar cronogramas
- resumir anotações
- criar flashcards
- sugerir revisões
- analisar produtividade

---

# UX E DESIGN

## VISUAL

A interface deve ser:
- moderna
- clean
- confortável
- elegante
- minimalista

Inspirar-se em:
- Notion
- Linear
- Arc
- Raycast

---

## EXPERIÊNCIA

Prioridades:
- rapidez
- foco
- fluidez
- clareza

Todas interações devem possuir:
- animações suaves
- feedback visual
- loading elegante
- transições suaves

---

# DARK MODE

Dark mode obrigatório.

Deve ser:
- confortável
- premium
- ótimo para estudos noturnos

---

# PERFORMANCE

Prioridades:
- 60fps
- lazy loading
- evitar re-renderizações
- carregamento rápido
- otimização de estado

---

# RESPONSIVIDADE

## Desktop
Experiência principal.

## Mobile
Muito importante.

Usuário deve conseguir:
- iniciar sessões rapidamente
- registrar estudos
- visualizar metas
- acessar matérias

---

# ORGANIZAÇÃO

Usuário pode criar:
- áreas
- matérias
- tópicos
- subtópicos
- sessões
- revisões

---

# SISTEMA DE SALVAMENTO

Implementar:
- auto save
- offline-first
- sincronização automática
- backup automático

---

# ACESSIBILIDADE

Obrigatório:
- suporte teclado
- aria labels
- contraste adequado
- foco visível

---

# ESTRUTURA DE PASTAS

```txt
src/
├── app/
├── components/
│   ├── dashboard/
│   ├── timer/
│   ├── subjects/
│   ├── tasks/
│   ├── charts/
│   └── ui/
├── hooks/
├── stores/
├── services/
├── features/
│   ├── auth/
│   ├── timer/
│   ├── analytics/
│   ├── subjects/
│   ├── ai/
│   └── settings/
├── types/
├── utils/
└── lib/