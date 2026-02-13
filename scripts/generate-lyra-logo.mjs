import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';

const [, , fontPath, outDirArg] = process.argv;
if (!fontPath) {
  console.error('Usage: node scripts/generate-lyra-logo.mjs <path-to-ttf> [outDir]');
  process.exit(1);
}

const outDir = outDirArg ? path.resolve(outDirArg) : path.resolve('public');
const logoPath = path.join(outDir, 'logo.svg');
const faviconPath = path.join(outDir, 'favicon.svg');

const font = opentype.loadSync(fontPath);
const text = 'lyra';

const target = {
  view: 256,
  paddingX: 26,
  paddingY: 34,
};

function makePath(fontSize) {
  const p = font.getPath(text, 0, 0, fontSize);
  const bbox = p.getBoundingBox();
  return { p, bbox };
}

function translatePath(pathObj, dx, dy) {
  for (const cmd of pathObj.commands) {
    if (typeof cmd.x === 'number') cmd.x += dx;
    if (typeof cmd.y === 'number') cmd.y += dy;
    if (typeof cmd.x1 === 'number') cmd.x1 += dx;
    if (typeof cmd.y1 === 'number') cmd.y1 += dy;
    if (typeof cmd.x2 === 'number') cmd.x2 += dx;
    if (typeof cmd.y2 === 'number') cmd.y2 += dy;
  }
}

let fontSize = 160;
for (let i = 0; i < 12; i++) {
  const { bbox } = makePath(fontSize);
  const w = bbox.x2 - bbox.x1;
  const h = bbox.y2 - bbox.y1;
  const maxW = target.view - target.paddingX * 2;
  const maxH = target.view - target.paddingY * 2;

  if (w <= maxW && h <= maxH) break;

  const scale = Math.min(maxW / w, maxH / h);
  fontSize = Math.floor(fontSize * scale);
}

const { p, bbox } = makePath(fontSize);

const w = bbox.x2 - bbox.x1;
const h = bbox.y2 - bbox.y1;

const cx = (bbox.x1 + bbox.x2) / 2;
const cy = (bbox.y1 + bbox.y2) / 2;

const targetCx = target.view / 2;
const targetCy = target.view / 2 + 10; // slight optical downshift

const dx = targetCx - cx;
const dy = targetCy - cy;

translatePath(p, dx, dy);
const d = p.toPathData(2);

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="lyra logo">
  <rect x="0" y="0" width="256" height="256" rx="60" ry="60" fill="#FFFFFF"/>
  <path d="${d}" fill="#DC2626"/>
</svg>
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(logoPath, svg, 'utf8');
fs.writeFileSync(faviconPath, svg, 'utf8');

console.log('Wrote:', logoPath);
console.log('Wrote:', faviconPath);
console.log('Font size:', fontSize, 'bbox:', { w, h });
