/**
 * Generates original, catchy SVG product tiles for every demo product.
 * Run once:  node scripts/generate-images.mjs
 * Output:    frontend/public/images/*.svg
 *
 * Each 600x600 tile contains:
 *   - rich category gradient background + diagonal sheen
 *   - floating bubbles & sparkles
 *   - category pill (top-left) and discount badge (top-right)
 *   - white "product plate" with the product emoji
 *   - product name (wrapped, max 2 lines) + JAYAMART wordmark
 *   - SOLD OUT ribbon when stock is 0
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

// Category gradients (fresh, modern grocery palette)
const CATEGORY_COLORS = {
  Grocery: ['#34d399', '#0f766e'],
  Fragrance: ['#c4b5fd', '#7c3aed'],
  Juice: ['#fbbf24', '#f97316'],
  'Ice Cream': ['#7dd3fc', '#6366f1'],
  Snacks: ['#fcd34d', '#f43f5e'],
  Stationery: ['#93c5fd', '#1e3a8a'],
  Makeup: ['#fda4af', '#db2777'],
};

const CATEGORY_EMOJI = {
  Grocery: '🛒',
  Fragrance: '🌸',
  Juice: '🧃',
  'Ice Cream': '🍨',
  Snacks: '🍪',
  Stationery: '✏️',
  Makeup: '💄',
};

// Per-product emoji so each tile looks distinct
const PRODUCT_EMOJI = {
  'sona-masoori-rice': '🍚',
  'premium-wheat-flour': '🌾',
  'sunflower-cooking-oil': '🧴',
  'organic-cane-sugar': '🍬',
  'toor-dal': '🥣',
  'midnight-bloom-perfume': '🌸',
  'ocean-fresh-body-spray': '🌊',
  'cedar-wood-deodorant': '🌲',
  'rose-elan-eau-de-parfum': '🌹',
  'vanilla-dream-body-mist': '🍦',
  'alphonso-mango-juice': '🥭',
  'fresh-orange-juice': '🍊',
  'kashmiri-apple-juice': '🍎',
  'mixed-fruit-juice': '🧃',
  'pomegranate-juice': '🍹',
  'classic-vanilla-ice-cream': '🍨',
  'belgian-chocolate-ice-cream': '🍫',
  'strawberry-swirl-ice-cream': '🍓',
  'butterscotch-blast': '🍮',
  'mango-sorbet': '🥭',
  'masala-potato-chips': '🥔',
  'butter-cookies': '🍪',
  'salted-popcorn': '🍿',
  'chocolate-cream-cookies': '🍫',
  'roasted-almonds': '🥜',
  'cheese-crackers': '🧀',
  'ruled-notebook': '📓',
  'gel-pens': '🖊️',
  'hb-wood-pencils': '✏️',
  'dual-tip-markers': '🖍️',
  'metal-geometry-box': '📐',
  'matte-lipstick-ruby-red': '💄',
  'deep-black-kajal': '👁️',
  'compact-powder-ivory': '💅',
  'liquid-foundation-warm-beige': '🧴',
  'nude-lip-gloss': '💋',
};

/** Escape text so it is always safe inside SVG/XML. */
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Split a product name into at most 2 balanced lines. */
function nameLines(name) {
  const words = name.split(' ');
  if (name.length <= 18) return [name];
  // find split point closest to the middle
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const left = words.slice(0, i).join(' ');
    const right = words.slice(i).join(' ');
    const diff = Math.abs(left.length - right.length);
    if (diff < bestDiff && left.length <= 20 && right.length <= 20) {
      bestDiff = diff;
      best = i;
    }
  }
  if (best === 1 && words.length > 1) {
    // could not balance within 20 chars - hard wrap by characters
    const mid = Math.ceil(name.length / 2);
    return [name.slice(0, mid).trim(), name.slice(mid).trim()];
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

/** Decorative sparkle (4-point star). */
function sparkle(x, y, size, opacity) {
  const s = size;
  const d = `M ${x} ${y - s} Q ${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q ${
    x + s * 0.18
  } ${y + s * 0.18} ${x} ${y + s} Q ${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q ${
    x - s * 0.18
  } ${y - s * 0.18} ${x} ${y - s} Z`;
  return `<path d="${d}" fill="#ffffff" opacity="${opacity}"/>`;
}

function svgFor(product, slug) {
  const [from, to] = CATEGORY_COLORS[product.category] || ['#c7d2fe', '#4338ca'];
  const emoji = PRODUCT_EMOJI[slug] || CATEGORY_EMOJI[product.category] || '🛒';
  const discount =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;
  const outOfStock = product.stock === 0;
  const lines = nameLines(product.name);
  const nameSize = lines.length > 1 ? 30 : 34;
  const line1Y = lines.length > 1 ? 498 : 508;
  const line2Y = 538;

  // name lines
  let nameSvg = `<text x="300" y="${line1Y}" font-size="${nameSize}" font-family="Segoe UI, Arial, sans-serif" font-weight="700" fill="#ffffff" text-anchor="middle">${esc(
    lines[0]
  )}</text>`;
  if (lines.length > 1) {
    nameSvg += `<text x="300" y="${line2Y}" font-size="${nameSize}" font-family="Segoe UI, Arial, sans-serif" font-weight="700" fill="#ffffff" text-anchor="middle">${esc(
      lines[1]
    )}</text>`;
  }

  // discount badge (top-right) - hidden when sold out
  let badgeSvg = '';
  if (discount > 0 && !outOfStock) {
    badgeSvg = `
  <g transform="rotate(8 505 92)">
    <circle cx="505" cy="92" r="56" fill="#ffffff" opacity="0.96"/>
    <circle cx="505" cy="92" r="56" fill="none" stroke="${to}" stroke-width="4" stroke-dasharray="6 7"/>
    <text x="505" y="88" font-size="34" font-family="Segoe UI, Arial, sans-serif" font-weight="800" fill="${to}" text-anchor="middle">${discount}%</text>
    <text x="505" y="118" font-size="17" font-family="Segoe UI, Arial, sans-serif" font-weight="700" fill="${to}" text-anchor="middle" letter-spacing="3">OFF</text>
  </g>`;
  }

  // SOLD OUT ribbon when stock is 0
  let ribbonSvg = '';
  if (outOfStock) {
    ribbonSvg = `
  <g transform="rotate(-32 300 300)">
    <rect x="-70" y="262" width="740" height="76" fill="#ef4444" opacity="0.95"/>
    <rect x="-70" y="262" width="740" height="76" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="3"/>
    <text x="300" y="314" font-size="40" font-family="Segoe UI, Arial, sans-serif" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="10">SOLD OUT</text>
  </g>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" role="img" aria-label="${esc(product.name)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>

  <rect width="600" height="600" fill="url(#bg)"/>
  <polygon points="0,0 600,0 600,300 0,120" fill="url(#sheen)"/>
  <rect width="600" height="600" fill="url(#glow)"/>

  <!-- floating bubbles -->
  <circle cx="70" cy="470" r="90" fill="#ffffff" opacity="0.10"/>
  <circle cx="540" cy="430" r="70" fill="#ffffff" opacity="0.12"/>
  <circle cx="120" cy="120" r="46" fill="#ffffff" opacity="0.14"/>
  <circle cx="470" cy="180" r="26" fill="#ffffff" opacity="0.18"/>
  <circle cx="240" cy="60" r="18" fill="#ffffff" opacity="0.20"/>
  <circle cx="60" cy="300" r="14" fill="#ffffff" opacity="0.22"/>

  <!-- sparkles -->
  ${sparkle(520, 300, 16, 0.75)}
  ${sparkle(90, 210, 12, 0.65)}
  ${sparkle(430, 70, 10, 0.7)}
  ${sparkle(170, 430, 9, 0.6)}

  <!-- category pill -->
  <g>
    <rect x="34" y="36" width="${Math.max(120, product.category.length * 13 + 44)}" height="44" rx="22" fill="#ffffff" opacity="0.22"/>
    <text x="${34 + Math.max(120, product.category.length * 13 + 44) / 2}" y="65" font-size="21" font-family="Segoe UI, Arial, sans-serif" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="2">${esc(
    product.category.toUpperCase()
  )}</text>
  </g>

  ${badgeSvg}

  <!-- product plate -->
  <ellipse cx="300" cy="425" rx="150" ry="26" fill="#000000" opacity="0.16"/>
  <circle cx="300" cy="272" r="142" fill="#ffffff" opacity="0.97" filter="url(#soft)"/>
  <circle cx="300" cy="272" r="142" fill="none" stroke="#ffffff" stroke-width="6"/>
  <circle cx="300" cy="272" r="126" fill="none" stroke="${from}" stroke-opacity="0.35" stroke-width="3" stroke-dasharray="4 10"/>
  <text x="300" y="332" font-size="150" text-anchor="middle">${emoji}</text>

  ${ribbonSvg}

  <!-- product name -->
  ${nameSvg}

  <!-- wordmark -->
  <text x="300" y="574" font-size="19" font-family="Segoe UI, Arial, sans-serif" font-weight="700" fill="#ffffff" fill-opacity="0.8" text-anchor="middle" letter-spacing="7">JAYAMART</text>
</svg>`;
}

let count = 0;
for (const product of DEMO_PRODUCTS) {
  const match = /\/images\/(.+)\.svg$/.exec(product.image || '');
  if (!match) continue;
  const slug = match[1];
  fs.writeFileSync(path.join(outDir, `${slug}.svg`), svgFor(product, slug), 'utf8');
  count += 1;
}

console.log(`Generated ${count} product images in ${outDir}`);
