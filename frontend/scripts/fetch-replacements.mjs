/**
 * Fetches replacement photos for specific products (overwrites the .jpg in place).
 * Filenames stay the same, so no DB/seed changes are needed.
 *
 * Candidates are validated against strict title rules so we never accept
 * a painting, diagram or off-topic photo.
 *
 * Run:  node scripts/fetch-replacements.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const imgDir = path.join(here, '..', 'public', 'images');

const UA = 'JayaMartDemo/1.0 (academic project; contact: student@example.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GLOBAL_BAD = /logo|icon|diagram|chart|map of|sign |sketch|label|stamp|coin|flag|poster|painting|drawing of|woodcut|engraving|manuscript|van gogh|monet|rembrandt/i;

// slug -> search plan
const TARGETS = {
  'gel-pens': {
    queries: ['gel pen', 'ballpoint pens colorful'],
    must: /gel pen|ballpoint|ink pen|pen case|pens\b/i,
    avoid: /paint|brush|quill|typewrit|tattoo/i,
    prefer: /gel|color|colour/i,
  },
  'metal-geometry-box': {
    queries: ['geometry box', 'compass protractor set'],
    must: /geometry|compass|protractor|ruler set|mathematical instrument/i,
    avoid: /woman|man |teacher|classroom|lesson|diagram|theorem|portrait/i,
    prefer: /box|set|kit/i,
  },
  'midnight-bloom-perfume': {
    queries: ['perfume bottle', 'perfume flacon glass'],
    must: /perfume|parfum|flacon|eau de/i,
    avoid: /shop|store|museum interior|ad\b/i,
    prefer: /bottle|flacon/i,
  },
  'ocean-fresh-body-spray': {
    queries: ['intitle:deodorant spray', 'intitle:"body spray"', 'deodorant spray can', 'aerosol spray can blue'],
    must: /deodorant|body spray|spray can|spray bottle|aerosol|antiperspirant/i,
    avoid: /woman|man |hair|clean|detergent|insect|paint|logo/i,
    prefer: /blue|ocean|fresh|cool|mint/i,
    looseMust: /spray|aerosol|deodorant/i,
  },
  'organic-cane-sugar': {
    queries: ['sugarcane juice glass', 'sugar cane juice'],
    must: /sugar ?cane|sugarcane/i,
    avoid: /field|harvest machine|factory/i,
    prefer: /juice|glass|drink/i,
  },
  'roasted-almonds': {
    queries: ['intitle:almond intitle:roast', 'roasted almonds', 'almond nuts bowl', 'almonds snack'],
    must: /almond/i,
    avoid: /water|tree|branch|flower|leaf|green|orchard|blossom|milk|salad|dessert|cake|cookie|chocolate|pie|recipe|dish|curry/i,
    prefer: /roast|nut|bowl|snack|plain/i,
    looseMust: /almond/i,
  },
  'rose-elan-eau-de-parfum': {
    queries: ['intitle:red intitle:perfume', 'intitle:rouge intitle:parfum', 'red perfume bottle', 'perfume bottle red'],
    must: /perfume|parfum|flacon/i,
    avoid: /shop|store|ad\b|box only/i,
    prefer: /red|rouge|ruby|crimson/i,
    // only accept bottles whose title confirms a red colour
    strictMust: /(red|rouge|ruby|crimson).*(perfume|parfum|flacon)|(perfume|parfum|flacon).*(red|rouge|ruby|crimson)/i,
    looseMust: /perfume|parfum|flacon/i,
  },
  'hb-wood-pencils': {
    queries: ['black pencils', 'black pencil graphite'],
    must: /pencil/i,
    avoid: /colou?r|paint|drawing|sketch|art\b|makeup|eye/i,
    prefer: /black|graphite|charcoal/i,
  },
};

async function search(query, limit = 10) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*' +
    '&generator=search&gsrnamespace=6&gsrlimit=' + limit +
    '&gsrsearch=' + encodeURIComponent('filetype:bitmap ' + query) +
    '&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=800';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('search HTTP ' + res.status);
  const data = await res.json();
  const pages = Object.values(data?.query?.pages || {});
  pages.sort((a, b) => (a.index ?? 99) - (b.index ?? 99));
  return pages;
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
      await sleep(2500 * (i + 1));
      continue;
    }
    return res;
  }
  return null;
}

function candidatesFor(plan, pages, mustKey = 'must') {
  const must = plan[mustKey] || plan.must;
  const out = [];
  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info) continue;
    if (!/jpeg|png/i.test(info.mime || '')) continue;
    if (!info.thumburl) continue;
    if (info.width && info.height && info.width / info.height < 0.35) continue;
    const title = p.title.replace(/^File:/i, '');
    if (GLOBAL_BAD.test(title)) continue;
    if (plan.avoid && plan.avoid.test(title)) continue;
    if (must && !must.test(title)) continue;
    out.push({ title, url: info.thumburl, score: plan.prefer && plan.prefer.test(title) ? 1 : 0 });
  }
  // preferred titles first, original relevance order inside each group
  return out.map((c, i) => ({ ...c, i })).sort((a, b) => b.score - a.score || a.i - b.i);
}

async function replaceImage(slug, plan) {
  let all = [];
  // pass 1: strictest rule (e.g. colour must be confirmed in the title)
  for (const query of plan.queries) {
    try {
      all = all.concat(candidatesFor(plan, await search(query), plan.strictMust ? 'strictMust' : 'must'));
    } catch (e) {
      console.log(`  search "${query}" failed: ${e.message}`);
    }
    await sleep(700);
  }
  // pass 2: relax the rule when nothing matched
  if (all.length === 0 && plan.looseMust) {
    for (const query of plan.queries) {
      try {
        all = all.concat(candidatesFor(plan, await search(query), 'looseMust'));
      } catch (e) {
        console.log(`  search "${query}" failed: ${e.message}`);
      }
      await sleep(700);
    }
  }
  // de-duplicate by title
  const seen = new Set();
  all = all.filter((c) => (seen.has(c.title) ? false : (seen.add(c.title), true)));

  let lastReason = 'no matching result';
  for (const pick of all.slice(0, 6)) {
    await sleep(700);
    const res = await fetchWithRetry(pick.url);
    if (!res || !res.ok) {
      lastReason = res ? 'HTTP ' + res.status : '403 after retries';
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000) {
      lastReason = 'too small';
      continue;
    }
    fs.writeFileSync(path.join(imgDir, slug + '.jpg'), buf);
    return { ok: true, title: pick.title, bytes: buf.length };
  }
  return { ok: false, reason: lastReason };
}

// optional filter: node scripts/fetch-replacements.mjs --only=slug1,slug2
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const only = onlyArg ? onlyArg.slice(7).split(',') : null;

let ok = 0;
for (const [slug, plan] of Object.entries(TARGETS)) {
  if (only && !only.includes(slug)) continue;
  const r = await replaceImage(slug, plan);
  if (r.ok) {
    ok += 1;
    console.log(`OK   ${slug}  (${(r.bytes / 1024).toFixed(0)} KB)  [${r.title}]`);
  } else {
    console.log(`FAIL ${slug}: ${r.reason}`);
  }
}
console.log(`\nReplaced ${ok}/${only ? only.length : Object.keys(TARGETS).length} images`);
