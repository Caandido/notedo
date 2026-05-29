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
src-tauri/target/release/bundle/nsis/Notedo_1.1.1_x64-setup.exe
```

## Build do `.apk` (Android, Capacitor)

O projeto nativo `android/` é gerado a cada build (não é versionado).
Requer **Node ≥22 + JDK 21 + Android SDK** (exigência do Capacitor 8).

```bash
npm run build                 # gera out/
npx cap add android           # cria android/ (1ª vez)
npx @capacitor/assets generate --android \
  --iconBackgroundColor "#0a0a0b" --iconBackgroundColorDark "#0a0a0b"
npx cap sync android
cd android && ./gradlew assembleDebug
```

O APK (debug, instalável por sideload) sai em:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

> Para um APK de release assinado, gere um keystore com `keytool` e configure
> a assinatura no Gradle + um secret `ANDROID_KEYSTORE_BASE64` no GitHub.

## Build automático no CI

O workflow `.github/workflows/release.yml` compila **`.exe` (Windows)** e
**`.apk` (Android)** na nuvem e anexa os dois à Release. Para disparar:

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
- Tauri v2 (desktop `.exe`) · Capacitor 8 (Android `.apk`)
