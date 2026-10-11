// One-time helper: point seedData.js image paths at the downloaded .jpg photos.
// Run from frontend/:  node scripts/apply-image-map.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const map = JSON.parse(fs.readFileSync(path.join(here, 'real-image-map.json'), 'utf8'));
const seedPath = path.join(here, '..', '..', 'backend', 'src', 'config', 'seedData.js');
let src = fs.readFileSync(seedPath, 'utf8');

let n = 0;
for (const [slug, image] of Object.entries(map)) {
  if (!image) continue;
  const from = '/images/' + slug + '.svg';
  const to = image;
  if (src.includes(from)) {
    src = src.split(from).join(to);
    n += 1;
  }
}

fs.writeFileSync(seedPath, src, 'utf8');
const left = (src.match(/\.svg/g) || []).length;
console.log('seedData.js: updated ' + n + ' image paths, remaining .svg refs: ' + left);
