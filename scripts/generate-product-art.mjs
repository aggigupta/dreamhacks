/**
 * Generates on-brand SVG art for every catalog product + seller, so each card
 * shows an image that actually matches the item (icon chosen by product name)
 * instead of an unrelated stock photo. Output: public/products/*.svg.
 *
 *   node scripts/generate-product-art.mjs
 *
 * Re-run after editing lib/mockProducts.ts. It rewrites the `image` and
 * `sellerAvatar` fields in that file to point at the generated assets.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "products");
mkdirSync(outDir, { recursive: true });

const CATEGORY = {
  food: { label: "Island Food", a: "#F6C667", b: "#E1893B", ink: "#6B3E12" },
  wellness: { label: "Wellness", a: "#8ED0CA", b: "#3E938C", ink: "#14413D" },
  craft: { label: "Handcraft", a: "#E3A87F", b: "#B5643C", ink: "#5C2E17" },
  "sustainable-goods": { label: "Sustainable", a: "#A9C39F", b: "#5C8A57", ink: "#264a22" },
  pantry: { label: "Pantry", a: "#F6C667", b: "#E1893B", ink: "#6B3E12" },
  "home-care": { label: "Home Care", a: "#8ED0CA", b: "#3E938C", ink: "#14413D" },
  gifting: { label: "Gifting", a: "#E3A87F", b: "#B5643C", ink: "#5C2E17" },
  accessories: { label: "Accessories", a: "#A9C39F", b: "#5C8A57", ink: "#264a22" },
};

// 24x24 line glyphs (stroke, round caps). Kept deliberately simple + legible.
const GLYPH = {
  jar: `<path d="M8 3h8M9 3v2.5C9 6 8 6.5 8 8v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8c0-1.5-1-2-1-2.5V3M7.5 12h9"/>`,
  honey: `<path d="M12 2v6M9 8h6M8 8l1.5 4.5a2.5 2.5 0 0 0 5 0L16 8M12 15v4M9.5 22h5"/>`,
  basket: `<path d="M3 9h18l-1.6 10.2a2 2 0 0 1-2 1.8H6.6a2 2 0 0 1-2-1.8L3 9zM8 9l2-5M16 9l-2-5M8.5 13v4M15.5 13v4M12 13v4"/>`,
  bottle: `<path d="M10 2h4M11 2v3.2c0 .9-.5 1.3-1.3 2.1A4 4 0 0 0 8.5 10v9a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-9a4 4 0 0 0-1.2-2.7C15.5 6.5 15 6.1 15 5.2V2M8.5 13h7"/>`,
  soap: `<rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M8 8c0-2 1.5-3.5 4-3.5S16 6 16 8M9.5 12.5h5"/>`,
  shell: `<path d="M12 21C6 21 3 16 3 10a9 9 0 0 1 18 0c0 6-3 11-9 11zM12 21V8M12 12l-4-3M12 12l4-3M12 16l-6-3M12 16l6-3"/>`,
  spoon: `<path d="M12 13v8M9.5 6.5a2.5 3.5 0 0 0 5 0 2.5 3.5 0 0 0-5 0zM12 10v3"/>`,
  branch: `<path d="M6 21c0-6 2-10 7-13M13 8l4-1M13 8l-1-4M9 13l3.5-1M9 13l-1-3.5"/>`,
  slices: `<path d="M4 15a8 8 0 0 1 16 0zM7.5 15a4.5 4.5 0 0 1 9 0M4 18h16"/>`,
  dropper: `<path d="M9 3h6M12 3v4M9 7h6l-.7 11a2 2 0 0 1-2 1.9h-.6a2 2 0 0 1-2-1.9L9 7zM10.5 21h3"/>`,
  fork: `<path d="M7 3v6a2 2 0 0 0 4 0V3M9 3v18M17 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4M17 3v18"/>`,
  book: `<path d="M5 4a2 2 0 0 1 2-2h12v18H7a2 2 0 0 0-2 2V4zM19 16H7a2 2 0 0 0-2 2M10 7h6"/>`,
  wrap: `<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 3v18M4 7.5l8 4 8-4"/>`,
  grinder: `<path d="M8 21h8M9 21c0-3-1-4-1-7h8c0 3-1 4-1 7M8 14c0-3 1-4 1-6h6c0 2 1 3 1 6M10 3.5h4"/>`,
  tube: `<path d="M9 3h6l-.5 3H9.5L9 3zM9.5 6h5l1 12a3 3 0 0 1-3 3h-1a3 3 0 0 1-3-3l1-12zM11 21v-4"/>`,
  pouch: `<path d="M6 8h12l-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8zM8 8c0-3 1.8-4.5 4-4.5S16 5 16 8M9 12h6"/>`,
};

function glyphFor(name, category) {
  const n = name.toLowerCase();
  const rules = [
    [/honey/, "honey"],
    [/grinder/, "grinder"],
    [/sunscreen/, "tube"],
    [/necklace|sea glass|seashell|shell|chime/, "shell"],
    [/basket|tote|bin|placemat|pandanus|bag/, "basket"],
    [/spoon/, "spoon"],
    [/driftwood|wall art/, "branch"],
    [/utensil|fork/, "fork"],
    [/journal|paper/, "book"],
    [/wrap/, "wrap"],
    [/chip|mango|slice/, "slices"],
    [/mist|tonic|essential oil|aloe/, "dropper"],
    [/bottle/, "bottle"],
    [/soap|mask|bath|soak/, "soap"],
    [/jam|oil|vanilla/, "jar"],
    [/sugar|salt|spice|blend/, "pouch"],
  ];
  for (const [re, g] of rules) if (re.test(n)) return g;
  return { food: "jar", wellness: "dropper", craft: "basket", "sustainable-goods": "wrap" }[category] || "jar";
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrapText(s, max = 22) {
  const words = s.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max && cur) {
      lines.push(cur.trim());
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}

function productSVG(name, category) {
  const c = CATEGORY[category] || CATEGORY.food;
  const g = GLYPH[glyphFor(name, category)];
  const lines = wrapText(name);
  const tspans = lines
    .map((l, i) => `<tspan x="40" dy="${i === 0 ? 0 : 30}">${esc(l)}</tspan>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" width="640" height="420">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c.a}"/><stop offset="1" stop-color="${c.b}"/>
    </linearGradient>
    <radialGradient id="hl" cx="0.25" cy="0.2" r="0.9">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="0.6" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect width="640" height="420" fill="url(#bg)"/>
  <rect width="640" height="420" fill="url(#hl)"/>
  <rect x="245" y="70" width="150" height="150" rx="32" fill="#ffffff" fill-opacity="0.16"/>
  <g transform="translate(260 85) scale(5)" fill="none" stroke="${c.ink}" stroke-opacity="0.9"
     stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${g}</g>
  <rect x="0" y="250" width="640" height="170" fill="url(#scrim)"/>
  <text x="40" y="70" font-family="Georgia, 'Times New Roman', serif" font-size="15"
     letter-spacing="3" fill="#ffffff" fill-opacity="0.85">SHOPYLAND · ${c.label.toUpperCase()}</text>
  <text x="40" y="345" font-family="Georgia, 'Times New Roman', serif" font-weight="bold"
     font-size="30" fill="#ffffff">${tspans}</text>
</svg>`;
}

function avatarSVG(seller) {
  const initials = seller
    .replace(/[^A-Za-z ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  let h = 0;
  for (const ch of seller) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="hsl(${hue} 45% 55%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 45% 38%)"/>
  </linearGradient></defs>
  <rect width="96" height="96" rx="20" fill="url(#a)"/>
  <text x="48" y="48" dy="0.35em" text-anchor="middle" font-family="Georgia, serif"
    font-weight="bold" font-size="38" fill="#ffffff">${initials}</text>
</svg>`;
}

// ---- parse products out of the TS source (regex, no TS runtime needed) ----
const srcPath = join(root, "lib", "mockProducts.ts");
let src = readFileSync(srcPath, "utf8");

const blocks = [...src.matchAll(/id:\s*"(p\d+)"[\s\S]*?category:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"|id:\s*"(p\d+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?category:\s*"([^"]+)"/g)];

// Simpler: iterate each product object individually.
const objs = [...src.matchAll(/\{\s*\n\s*id:\s*"(p\d+)",[\s\S]*?\n  \},/g)];
let count = 0;
const sellers = new Set();
for (const m of objs) {
  const obj = m[0];
  const id = m[1];
  const name = (obj.match(/name:\s*"([^"]+)"/) || [])[1];
  const category = (obj.match(/category:\s*"([^"]+)"/) || [])[1];
  const seller = (obj.match(/seller:\s*"([^"]+)"/) || [])[1];
  if (!name || !category) continue;
  writeFileSync(join(outDir, `${id}.svg`), productSVG(name, category));
  count++;
  if (seller) sellers.add(seller);
}

const sellerSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
for (const s of sellers) {
  writeFileSync(join(outDir, `seller-${sellerSlug(s)}.svg`), avatarSVG(s));
}

// Category placeholders for newly-listed products with no image, + default avatar.
for (const cat of Object.keys(CATEGORY)) {
  writeFileSync(join(outDir, `new-${cat}.svg`), productSVG(`New ${CATEGORY[cat].label} Listing`, cat));
}
writeFileSync(join(outDir, `seller-default.svg`), avatarSVG("Island Artisan"));

// ---- rewrite image + sellerAvatar fields ----
src = src.replace(
  /(\n\s*id:\s*"(p\d+)",[\s\S]*?\n\s*image:\s*)"[^"]*"/g,
  (full, pre, id) => `${pre}"/products/${id}.svg"`,
);
src = src.replace(
  /(seller:\s*"([^"]+)"[\s\S]*?sellerAvatar:\s*)"[^"]*"/g,
  (full, pre, seller) => `${pre}"/products/seller-${sellerSlug(seller)}.svg"`,
);
writeFileSync(srcPath, src);

console.log(`Generated ${count} product images + ${sellers.size} seller avatars into public/products/`);
console.log(`Rewrote image/sellerAvatar fields in lib/mockProducts.ts`);
