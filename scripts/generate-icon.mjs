// Gera o ícone do app (1024x1024) a partir de um SVG vetorial e grava nas duas
// fontes que o CI consome: src-tauri/app-icon.png (Windows, via `tauri icon`) e
// assets/icon.png (Android, via `@capacitor/assets generate`).
//
//   node scripts/generate-icon.mjs
//
// Design: clean/minimalista na paleta do app — tile VIOLETA (cor-assinatura,
// hue ~286) com o monograma N branco. O tile grafite anterior sumia na taskbar
// escura do Windows (quase-preto sobre quase-preto); um tile violeta sólido fica
// nítido em qualquer fundo (taskbar escura, desktop claro, launcher Android).
// Os favicons web (src/app/icon.svg e apple-icon.svg) seguem o mesmo desenho.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Desenho mestre, 1024x1024. Tile violeta (gradiente) + N branco.
const svg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="512" y1="0" x2="512" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#8b81f7"/>
      <stop offset="1" stop-color="#5a4fd6"/>
    </linearGradient>
    <radialGradient id="glow" cx="360" cy="320" r="620" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sheen" x1="512" y1="56" x2="512" y2="420" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="1024" height="1024" rx="232" fill="url(#bg)"/>
  <rect x="0" y="0" width="1024" height="1024" rx="232" fill="url(#glow)"/>
  <path d="M56 76 Q56 56 76 56 L948 56 Q968 56 968 76 L968 380 Q512 470 56 380 Z" fill="url(#sheen)"/>

  <!-- monograma N branco -->
  <path d="M336 720 L336 304 L688 720 L688 304"
    fill="none" stroke="#ffffff" stroke-width="116"
    stroke-linecap="round" stroke-linejoin="round"/>

  <!-- borda interna sutil pra dar bisel -->
  <rect x="6" y="6" width="1012" height="1012" rx="226" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="3"/>
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
