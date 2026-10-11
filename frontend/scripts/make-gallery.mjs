// Quick review page: grid of all downloaded product photos.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const imgDir = path.join(here, '..', 'public', 'images');
const files = fs.readdirSync(imgDir).filter((f) => f.endsWith('.jpg')).sort();

const titleCase = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const cells = files
  .map(
    (f) =>
      `<figure><img src="images/${f}" loading="lazy" alt="${titleCase(
        path.basename(f, '.jpg')
      )}"/><figcaption>${titleCase(path.basename(f, '.jpg'))}</figcaption></figure>`
  )
  .join('\n');

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>JayaMart - Product Photo Gallery</title>
<style>
  body { font-family: "Segoe UI", Arial, sans-serif; margin: 24px; background: #0f172a; color: #fff; }
  h1 { font-size: 22px; }
  p.note { color: #94a3b8; font-size: 14px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
  figure { margin: 0; background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
  img { width: 100%; height: 170px; object-fit: cover; display: block; }
  figcaption { padding: 8px 10px; font-size: 13px; }
</style>
</head>
<body>
<h1>JayaMart &mdash; all ${files.length} product photos</h1>
<p class="note">Real product photos from Wikimedia Commons (free licenses). Original SVG tile fallbacks remain in <code>/images/</code>.</p>
<div class="grid">
${cells}
</div>
</body>
</html>`;

fs.writeFileSync(path.join(here, '..', 'public', 'gallery.html'), html, 'utf8');
console.log(`gallery.html written with ${files.length} images`);
