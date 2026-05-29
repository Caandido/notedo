# Notedo

App de estudos focado em produtividade, foco e métricas de aprendizado.

Esta branch (`offline-mode`) é a versão **offline-first**: um SPA 100% client-side
que guarda tudo no **IndexedDB** (via Dexie). Funciona sem internet e é empacotável
como aplicativo de desktop (Windows `.exe` via Tauri).

> A versão web server-rendered (Prisma + Postgres + NextAuth) continua na branch `main`.

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:3000
```

Os dados ficam no IndexedDB do navegador — limpar o storage zera o app.

## Build estático (SPA)

```bash
npm run build    # gera out/ (static export, output: 'export')
npm run start    # serve out/ localmente com `npx serve`
```

Todas as rotas são estáticas e resolvem os dados no cliente. As telas de detalhe
usam query-params (`/subject?id=...`, `/topic?id=...`) porque os IDs nascem em
runtime no IndexedDB e não há como pré-gerar HTML por ID.

## Build do `.exe` (Windows, Tauri)

Requer toolchain local: **Rust** (stable) + **MSVC Build Tools** + Node 20.

```bash
npx tauri icon src-tauri/app-icon.png   # gera os ícones em src-tauri/icons/
npm run build:exe                        # next build -> out/  +  tauri build
```

O instalador NSIS sai em:

```
src-tauri/target/release/bundle/nsis/Notedo_1.1.0_x64-setup.exe
```

### Build automático no CI

O workflow `.github/workflows/release.yml` compila o `.exe` na nuvem
(runner Windows) e anexa o instalador à Release. Para disparar:

```bash
git tag v1.1.0
git push origin v1.1.0
```

Também dá pra rodar manualmente em **Actions → Release → Run workflow**.

## Stack

- Next.js 16 (App Router, static export) · TypeScript · TailwindCSS v4
- Dexie (IndexedDB) para persistência offline
- TipTap (editor rico) · KaTeX (equações) · Recharts (gráficos)
- Zustand (timer) · Framer Motion
- Tauri v2 para empacotar o desktop
