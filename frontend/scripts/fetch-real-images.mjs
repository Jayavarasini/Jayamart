/**
 * Downloads realistic, freely-licensed product photos (Wikimedia Commons)
 * and saves them locally as public/images/<slug>.jpg.
 *
 * Run:  node scripts/fetch-real-images.mjs
 *
 * Products whose download fails keep their generated SVG tile
 * (seedData image path is only changed for successful downloads).
 */
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirnameName = path.dirname(fileURLToPath(import.meta.url));
const { DEMO_PRODUCTS } = require(
  path.join(__dirnameName, '..', '..', 'backend', 'src', 'config', 'seedData.js')
);

const outDir = path.join(__dirnameName, '..', 'public', 'images');
fs.mkdirSync(outDir, { recursive: true });

const UA = 'JayaMartDemo/1.0 (academic project; contact: student@example.com)';

// Curated search queries per product slug for good, relevant photos.
const QUERIES = {
  'sona-masoori-rice': 'white rice grains bowl',
  'premium-wheat-flour': 'wheat flour bag',
  'sunflower-cooking-oil': 'sunflower oil bottle',
  'organic-cane-sugar': 'cane sugar crystals',
  'toor-dal': 'toor dal lentils',
  'midnight-bloom-perfume': 'perfume bottle glass',
  'ocean-fresh-body-spray': 'deodorant spray bottle',
  'cedar-wood-deodorant': 'deodorant stick',
  'rose-elan-eau-de-parfum': 'perfume bottle pink',
  'vanilla-dream-body-mist': 'perfume atomizer bottle',
  'alphonso-mango-juice': 'mango juice glass',
  'fresh-orange-juice': 'orange juice glass',
  'kashmiri-apple-juice': 'apple juice glass',
  'mixed-fruit-juice': 'fruit juice glasses',
  'pomegranate-juice': 'pomegranate juice glass',
  'classic-vanilla-ice-cream': 'vanilla ice cream scoop',
  'belgian-chocolate-ice-cream': 'chocolate ice cream scoops',
  'strawberry-swirl-ice-cream': 'strawberry ice cream scoop',
  'butterscotch-blast': 'ice cream cone caramel',
  'mango-sorbet': 'mango sorbet',
  'masala-potato-chips': 'potato chips bowl',
  'butter-cookies': 'butter cookies',
  'salted-popcorn': 'popcorn bowl',
  'chocolate-cream-cookies': 'chocolate cookies',
  'roasted-almonds': 'roasted almonds',
  'cheese-crackers': 'cheese crackers',
  'ruled-notebook': 'spiral notebook',
  'gel-pens': 'colorful gel pens',
  'hb-wood-pencils': 'wooden pencils',
  'dual-tip-markers': 'felt tip markers colorful',
  'metal-geometry-box': 'drawing compass geometry',
  'matte-lipstick-ruby-red': 'red lipstick',
  'deep-black-kajal': 'kajal eyeliner',
  'compact-powder-ivory': 'face powder compact',
  'liquid-foundation-warm-beige': 'liquid foundation makeup bottle',
  'nude-lip-gloss': 'lip gloss tube',
};

// Titles that usually mean a diagram/logo/bad photo for a product tile.
const BAD_TITLE = /logo|icon|diagram|chart|map|sign|drawing|sketch|label|stamp|coin|flag|poster/i;

// Second-chance queries when the first query returns nothing suitable.
const ALT_QUERIES = {
  'alphonso-mango-juice': 'mango juice',
  'butterscotch-blast': 'ice cream cone',
  'gel-pens': 'pens stationery school',
  'cedar-wood-deodorant': 'spray can aerosol',
  'vanilla-dream-body-mist': 'fragrance bottle',
  'roasted-almonds': 'almonds',
  'matte-lipstick-ruby-red': 'lipstick makeup',
};

const RETRY_ONLY = process.argv.includes('--retry');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchCommons(query, limit = 8) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*' +
    '&generator=search&gsrnamespace=6&gsrlimit=' +
    limit +
    '&gsrsearch=' +
    encodeURIComponent('filetype:bitmap ' + query) +
    '&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=800';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('search failed: HTTP ' + res.status);
  const data = await res.json();
  const pages = Object.values(data?.query?.pages || {});
  // search returns relevance order but with index property
  pages.sort((a, b) => (a.index ?? 99) - (b.index ?? 99));
  return pages;
}

function pickAllGood(pages) {
  const out = [];
  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info) continue;
    if (!/jpeg|png/i.test(info.mime || '')) continue;
    if (BAD_TITLE.test(p.title)) continue;
    if (!info.thumburl) continue;
    // skip extremely tall photos (pen-shaped objects are fine)
    if (info.width && info.height && info.width / info.height < 0.35) continue;
    out.push({ title: p.title, url: info.thumburl });
  }
  return out;
}

async function fetchWithRetry(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: 'https://commons.wikimedia.org/',
      },
    });
    if (res.ok) return res;
    if (res.status === 403 || res.status === 429) {
      await sleep(2500 * (i + 1)); // back off and retry
      continue;
    }
    return res;
  }
  return null;
}

async function download(slug, query) {
  const pages = await searchCommons(query);
  let picks = pickAllGood(pages);
  if (picks.length === 0 && ALT_QUERIES[slug]) {
    const alt = await searchCommons(ALT_QUERIES[slug]);
    picks = pickAllGood(alt);
  }
  if (picks.length === 0) return { ok: false, reason: 'no suitable result' };
  // Try candidates in order until one downloads (some thumbnails are 403-blocked).
  let lastReason = 'download failed';
  for (const pick of picks.slice(0, 5)) {
    const res = await fetchWithRetry(pick.url);
    if (!res) { lastReason = 'download 403 after retries'; continue; }
    if (!res.ok) { lastReason = 'download HTTP ' + res.status; continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000) { lastReason = 'file too small'; continue; }
    fs.writeFileSync(path.join(outDir, `${slug}.jpg`), buf);
    return { ok: true, title: pick.title, bytes: buf.length };
  }
  return { ok: false, reason: lastReason };
}

let okCount = 0;
const failed = [];
const mapping = {}; // slug -> .jpg or null (keep svg)

// In --retry mode, keep previous successes and only re-fetch failures.
if (RETRY_ONLY) {
  try {
    Object.assign(mapping, JSON.parse(fs.readFileSync(path.join(__dirnameName, 'real-image-map.json'), 'utf8')));
  } catch {}
}

for (const product of DEMO_PRODUCTS) {
  const match = /\/images\/(.+)\.svg$/.exec(product.image || '');
  if (!match) continue;
  const slug = match[1];
  if (RETRY_ONLY && mapping[slug]) {
    okCount += 1;
    continue; // already downloaded
  }
  const query = QUERIES[slug];
  await sleep(900); // be polite to the Wikimedia API
  if (!query) {
    failed.push(slug + ' (no query)');
    mapping[slug] = null;
    continue;
  }
  try {
    const r = await download(slug, query);
    if (r.ok) {
      okCount += 1;
      mapping[slug] = '/images/' + slug + '.jpg';
      console.log(`OK   ${slug} <- "${query}" (${(r.bytes / 1024).toFixed(0)} KB)`);
    } else {
      failed.push(slug + ' (' + r.reason + ')');
      mapping[slug] = null;
      console.log(`FAIL ${slug}: ${r.reason}`);
    }
  } catch (e) {
    failed.push(slug + ' (' + e.message + ')');
    mapping[slug] = null;
    console.log(`FAIL ${slug}: ${e.message}`);
  }
}

fs.writeFileSync(
  path.join(__dirnameName, 'real-image-map.json'),
  JSON.stringify(mapping, null, 2),
  'utf8'
);

console.log(`\nDownloaded ${okCount} images; ${failed.length} kept SVG.`);
if (failed.length) console.log('Failed: ' + failed.join(', '));
