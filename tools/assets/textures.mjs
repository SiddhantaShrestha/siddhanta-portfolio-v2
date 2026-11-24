// Builds the two screen textures in public/textures.
// - monitor-screen.webp: the verified RecruitNepal screenshot, cover-cropped
//   to the monitor aspect ratio (1.66 x 0.69).
// - panel-display.webp: an abstract status display (no text, no claims).
import { mkdirSync, statSync } from "node:fs";
import sharp from "sharp";

mkdirSync("public/textures", { recursive: true });

const MONITOR = { width: 2048, height: Math.round(2048 / (1.66 / 0.69)) };
await sharp("public/projects/recruitnepal.png")
  .resize(MONITOR.width, MONITOR.height, { fit: "cover", position: "top" })
  .webp({ quality: 86 })
  .toFile("public/textures/monitor-screen.webp");

const W = 640;
const H = 256;
const bars = Array.from({ length: 22 }, (_, i) => {
  const h = 18 + ((i * 37) % 70);
  const x = 28 + i * 12;
  return `<rect x="${x}" y="${H - 28 - h}" width="7" height="${h}" rx="2" fill="#2b9bb0" opacity="${0.45 + (i % 4) * 0.12}"/>`;
}).join("");
const wave = Array.from({ length: 60 }, (_, i) => {
  const x = 300 + i * 5.4;
  const y = 70 + Math.sin(i / 3.2) * 20 + Math.sin(i / 1.3) * 8;
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}).join(" ");
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a2236"/>
      <stop offset="1" stop-color="#061423"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="10" fill="none" stroke="#1d5568" stroke-width="2"/>
  ${bars}
  <polyline points="${wave}" fill="none" stroke="#3ee0f0" stroke-width="4" stroke-linejoin="round"/>
  <rect x="300" y="128" width="150" height="10" rx="5" fill="#3ee0f0" opacity="0.9"/>
  <rect x="300" y="150" width="230" height="10" rx="5" fill="#9b8cff" opacity="0.8"/>
  <rect x="300" y="172" width="110" height="10" rx="5" fill="#2b9bb0" opacity="0.7"/>
  <circle cx="570" cy="60" r="14" fill="none" stroke="#3ee0f0" stroke-width="4"/>
  <circle cx="570" cy="60" r="5" fill="#3ee0f0"/>
</svg>`;
await sharp(Buffer.from(svg))
  .webp({ quality: 88 })
  .toFile("public/textures/panel-display.webp");

for (const f of ["monitor-screen", "panel-display"]) {
  const size = statSync(`public/textures/${f}.webp`).size;
  console.log(`${f}.webp ${(size / 1024).toFixed(1)} KB`);
}
