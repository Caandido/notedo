// Gera o ícone do app (1024x1024) a partir de um SVG vetorial e grava nas duas
// fontes que o CI consome: src-tauri/app-icon.png (Windows, via `tauri icon`) e
// assets/icon.png (Android, via `@capacitor/assets generate`).
//
//   node scripts/generate-icon.mjs
//
// Design: "gel/aqua" estilo anos 2000 (Web 2.0) — squircle com gradiente azul
// vívido, brilho glossy no topo (reflexo) e o monograma N branco por cima, limpo.
// Os favicons web (src/app/icon.svg e apple-icon.svg) seguem o mesmo desenho.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Desenho mestre, 1024x1024. Gel azul + reflexo glossy + N branco.
const svg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="512" y1="40" x2="512" y2="984" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#5b9dff"/>
      <stop offset="0.52" stop-color="#2f6bed"/>
      <stop offset="1" stop-color="#1b3aa8"/>
    </linearGradient>
    <linearGradient id="gloss" x1="512" y1="56" x2="512" y2="540" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="vign" cx="512" cy="560" r="600" gradientUnits="userSpaceOnUse">
      <stop offset="0.68" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#001246" stop-opacity="0.28"/>
    </radialGradient>
  </defs>

  <!-- base do gel -->
  <rect x="0" y="0" width="1024" height="1024" rx="232" fill="url(#bg)"/>
  <rect x="0" y="0" width="1024" height="1024" rx="232" fill="url(#vign)"/>

  <!-- reflexo glossy: domo no topo -->
  <path d="M56 76 Q56 56 76 56 L948 56 Q968 56 968 76 L968 400 Q512 600 56 400 Z"
    fill="url(#gloss)"/>

  <!-- sombra sutil do N -->
  <path d="M340 726 L340 310 L692 726 L692 310"
    fill="none" stroke="#001246" stroke-opacity="0.22" stroke-width="116"
    stroke-linecap="round" stroke-linejoin="round"/>
  <!-- monograma N branco -->
  <path d="M336 720 L336 304 L688 720 L688 304"
    fill="none" stroke="#ffffff" stroke-width="116"
    stroke-linecap="round" stroke-linejoin="round"/>

  <!-- borda interna pra dar bisel -->
  <rect x="6" y="6" width="1012" height="1012" rx="226" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="4"/>
</svg>`;

const targets = [
  join(root, "src-tauri", "app-icon.png"),
  join(root, "assets", "icon.png"),
];

const buf = Buffer.from(svg);
for (const out of targets) {
  await sharp(buf, { density: 384 })
    .resize(1024, 1024)
    .png()
    .toFile(out);
  console.log("wrote", out);
}
