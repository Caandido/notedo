// Gera o ícone do app (1024x1024) a partir de um SVG vetorial e grava nas duas
// fontes que o CI consome: src-tauri/app-icon.png (Windows, via `tauri icon`) e
// assets/icon.png (Android, via `@capacitor/assets generate`).
//
//   node scripts/generate-icon.mjs
//
// O SVG do favicon web (src/app/icon.svg e apple-icon.svg) é mantido à mão,
// com o mesmo desenho simplificado — esses são servidos como SVG direto.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Desenho mestre, 1024x1024.
const svg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#4f46e5"/>
      <stop offset="0.52" stop-color="#7c3aed"/>
      <stop offset="1" stop-color="#9333ea"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.28" cy="0.2" r="0.95">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.38"/>
      <stop offset="0.42" stop-color="#ffffff" stop-opacity="0.07"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="nfill" x1="360" y1="312" x2="664" y2="712" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#ede9fe"/>
    </linearGradient>
    <linearGradient id="hl" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fbbf24"/>
      <stop offset="1" stop-color="#fb923c"/>
    </linearGradient>
    <filter id="nshadow" x="-25%" y="-25%" width="150%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="22" flood-color="#180c3a" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- fundo squircle -->
  <rect x="0" y="0" width="1024" height="1024" rx="232" fill="url(#bg)"/>
  <!-- luz superior esquerda -->
  <rect x="0" y="0" width="1024" height="1024" rx="232" fill="url(#glow)"/>

  <!-- traço de marca-texto (estudo) sob o N -->
  <g transform="rotate(-6 512 604)">
    <rect x="306" y="560" width="404" height="96" rx="48" fill="url(#hl)" fill-opacity="0.92"/>
  </g>

  <!-- monograma N -->
  <g filter="url(#nshadow)">
    <path d="M360 712 L360 312 L664 712 L664 312"
      fill="none" stroke="url(#nfill)" stroke-width="120"
      stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- moldura interna sutil -->
  <rect x="9" y="9" width="1006" height="1006" rx="225" fill="none" stroke="#ffffff" stroke-opacity="0.1" stroke-width="2"/>
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
