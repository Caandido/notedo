import type { MetadataRoute } from "next";

// Exigido pelo `output: export` (SPA estático) — emite manifest.webmanifest no build.
export const dynamic = "force-static";

// Web App Manifest — habilita "instalar" como PWA (Android/desktop) e melhora o
// "Adicionar à Tela de Início" no iOS (abre standalone, em tela cheia). Offline e
// sync continuam vindo do Dexie/Supabase do próprio app. Os PNGs em public/ são
// gerados por scripts/generate-pwa-icons.mjs. No iOS o ícone da home vem do
// apple-icon.svg (metadata do Next), não daqui.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Notedo",
    short_name: "Notedo",
    description:
      "Aplicativo de estudos focado em produtividade, foco e métricas de aprendizado.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "pt-BR",
    background_color: "#0b0b0d",
    theme_color: "#5a4fd6",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
