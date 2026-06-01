// Gera o ícone do app (1024x1024) a partir de um SVG vetorial e grava nas duas
// fontes que o CI consome: src-tauri/app-icon.png (Windows, via `tauri icon`) e
// assets/icon.png (Android, via `@capacitor/assets generate`).
//
//   node scripts/generate-icon.mjs
//
// Design: minimalista — fundo preto (squircle) + monograma N branco, traço
// limpo. Os favicons web (src/app/icon.svg e apple-icon.svg) seguem o mesmo
// desenho e são servidos como SVG direto.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Desenho mestre, 1024x1024. Fundo preto, N branco geométrico.
const svg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="1024" height="1024" rx="232" fill="#0a0a0b"/>
  <!-- moldura interna sutil pra dar profundidade -->
  <rect x="8" y="8" width="1008" height="1008" rx="226" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="2"/>
  <!-- monograma N: duas verticais + diagonal, traço uniforme -->
  <path d="M336 720 L336 304 L688 720 L688 304"
    fill="none" stroke="#fafafa" stroke-width="116"
    stroke-linecap="round" stroke-linejoin="round"/>
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
