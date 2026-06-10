// Gera os ícones PWA que o manifest consome, no mesmo N violeta do app.
//
//   node scripts/generate-pwa-icons.mjs
//
// Saídas em public/:
//   icon-192.png            (purpose "any", cantos arredondados)
//   icon-512.png            (purpose "any", cantos arredondados)
//   icon-maskable-512.png   (purpose "maskable", full-bleed — o launcher recorta
//                            a máscara; o N fica na zona segura central)
// E na convenção do Next (src/app/):
//   apple-icon.png          (180x180, full-bleed — o iOS NÃO aceita SVG como ícone
//                            de tela inicial, só PNG; e arredonda ele sozinho)
//
// Mantém a paleta de generate-icon.mjs.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Tile com cantos arredondados (rx ~22% como nos ícones de app), p/ purpose "any".
const rounded = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="256" y1="0" x2="256" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#8b81f7"/>
      <stop offset="1" stop-color="#5a4fd6"/>
    </linearGradient>
    <radialGradient id="glow" cx="180" cy="160" r="310" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="116" fill="url(#bg)"/>
  <rect x="0" y="0" width="512" height="512" rx="116" fill="url(#glow)"/>
  <path d="M168 360 L168 152 L344 360 L344 152" fill="none" stroke="#ffffff"
    stroke-width="58" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="3" y="3" width="506" height="506" rx="113" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="1.5"/>
</svg>`;

// Full-bleed (sem cantos) p/ purpose "maskable": o launcher aplica a própria máscara.
// N levemente menor pra caber na zona segura (~80% central) de qualquer recorte.
const maskable = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="256" y1="0" x2="256" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#8b81f7"/>
      <stop offset="1" stop-color="#5a4fd6"/>
    </linearGradient>
    <radialGradient id="glow" cx="180" cy="160" r="310" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" fill="url(#bg)"/>
  <rect x="0" y="0" width="512" height="512" fill="url(#glow)"/>
  <path d="M190 332 L190 180 L322 332 L322 180" fill="none" stroke="#ffffff"
    stroke-width="50" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const jobs = [
  { svg: rounded, size: 192, dir: "public", out: "icon-192.png" },
  { svg: rounded, size: 512, dir: "public", out: "icon-512.png" },
  { svg: maskable, size: 512, dir: "public", out: "icon-maskable-512.png" },
  // apple-touch-icon: full-bleed (iOS arredonda), PNG obrigatório no iPhone.
  { svg: maskable, size: 180, dir: "src/app", out: "apple-icon.png" },
];

for (const { svg, size, dir, out } of jobs) {
  const file = join(root, dir, out);
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png()
    .toFile(file);
  console.log("wrote", file);
}
