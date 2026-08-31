// Pre-publish sanity check for the weekly TOP 10 dashboard.
// Run after editing output/*.html and rendering, before committing:
//   npm run check
// Exits non-zero (and prints what failed) so a bad publish is caught locally
// or in the weekly cloud run instead of on the live site.

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const p = (...s) => path.join(root, ...s);
const read = (f) => fs.readFileSync(p(f), 'utf8');

const LOGO = 'assets/logo_iemhometok.png';
const LOGO_INLINE = 'assets/logo_iemhometok_256.png';
const OLD_LOGOS = ['logo-transparent.png', 'IEUM_HOMETOK_Lower_Transparent.png'];
const SITE = 'https://realestate-weekly-top10.netlify.app';

const failures = [];
const notes = [];
const fail = (m) => failures.push(m);

function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const count = (h, re) => (h.match(re) || []).length;

// --- the four documents that must stay in sync -----------------------------
// cover: cover-only.html is the OG thumbnail source (cover section only, no list)
// linked: artifact/index wrap every card in <a href>; report.html must not
const DOCS = [
  { file: 'output/report.html', cover: false, linked: false, inline: false },
  { file: 'output/cover-only.html', cover: true, linked: false, inline: false },
  { file: 'output/artifact.html', cover: false, linked: true, inline: true },
  { file: 'netlify-deploy/index.html', cover: false, linked: true, inline: true },
];

const dates = new Set();

for (const { file, cover, linked, inline } of DOCS) {
  if (!fs.existsSync(p(file))) { fail(`${file}: missing`); continue; }
  const h = read(file);

  const date = (h.match(/cover-date">([^<]*)</) || [])[1];
  if (!date) fail(`${file}: no .cover-date found`);
  else dates.add(date.trim());

  // logo: the two static docs reference the file, the two published docs inline it
  if (inline) {
    const m = h.match(/src="data:image\/png;base64,([^"]+)"/);
    if (!m) fail(`${file}: logo is not inlined as a data URI (Netlify path would break)`);
    else {
      const got = crypto.createHash('md5').update(Buffer.from(m[1], 'base64')).digest('hex');
      const want = crypto.createHash('md5').update(fs.readFileSync(p(LOGO_INLINE))).digest('hex');
      if (got !== want) fail(`${file}: inlined logo does not match ${LOGO_INLINE}`);
    }
  } else if (!h.includes(LOGO)) {
    fail(`${file}: does not reference ${LOGO}`);
  }
  for (const old of OLD_LOGOS) {
    if (h.includes(old)) fail(`${file}: still references retired logo ${old}`);
  }

  // the badge already carries the wordmark - no brand text beside it
  if (/class="brand-(text|name|sub)"/.test(h)) {
    fail(`${file}: brand text next to the logo was reintroduced (see CLAUDE.md)`);
  }

  // structure
  const items = count(h, /class="list-item"/g);
  const wantItems = cover ? 0 : 10;
  if (items !== wantItems) fail(`${file}: ${items} list items, expected ${wantItems}`);

  const cards = count(h, /class="top3-card"/g);
  if (cards !== 3) fail(`${file}: ${cards} top3 cards, expected 3`);

  const links = count(h, /<a class="(top3-card|list-link)"/g);
  const wantLinks = linked ? 13 : 0;
  if (links !== wantLinks) {
    fail(`${file}: ${links} linked cards, expected ${wantLinks}` +
      (linked ? ' (3 top3 + 10 list)' : ' (this file is rendered to PNG, links are dead weight)'));
  }

  if (linked) {
    const hrefs = [...h.matchAll(/<a class="(?:top3-card|list-link)" href="([^"]+)"/g)].map((m) => m[1]);
    for (const u of hrefs) {
      if (!/^https?:\/\//.test(u)) fail(`${file}: non-http link ${u}`);
    }
    const listHrefs = [...h.matchAll(/<a class="list-link" href="([^"]+)"/g)].map((m) => m[1]);
    const dupes = listHrefs.filter((u, i) => listHrefs.indexOf(u) !== i);
    if (dupes.length) fail(`${file}: duplicate article URLs: ${[...new Set(dupes)].join(', ')}`);
  }

  // tag balance - a stray </div> silently wrecks the layout
  const body = h.includes('<div class="sheet"') ? h.slice(h.indexOf('<div class="sheet"')) : h;
  const open = count(body, /<div\b/g), close = count(body, /<\/div>/g);
  if (open !== close) fail(`${file}: unbalanced divs (${open} open, ${close} close)`);
  const aOpen = count(body, /<a\b/g), aClose = count(body, /<\/a>/g);
  if (aOpen !== aClose) fail(`${file}: unbalanced anchors (${aOpen} open, ${aClose} close)`);

  if (/<<<<<<<|>>>>>>>/.test(h)) fail(`${file}: merge conflict markers left in file`);
}

// every document must show the same publication week
if (dates.size > 1) fail(`cover dates disagree across files: ${[...dates].join(' | ')}`);
else if (dates.size === 1) notes.push(`week: ${[...dates][0]}`);

// --- artifact.html and index.html must carry the same body -------------------
// index.html is artifact.html wrapped in a full document with OG tags; if the
// two drift, the Netlify page and the Artifact show different news.
if (fs.existsSync(p('output/artifact.html')) && fs.existsSync(p('netlify-deploy/index.html'))) {
  const sheet = (h) => {
    const i = h.indexOf('<div class="sheet"');
    return i < 0 ? null : h.slice(i, h.lastIndexOf('</div>') + 6).trim();
  };
  const a = sheet(read('output/artifact.html'));
  const b = sheet(read('netlify-deploy/index.html'));
  if (a && b && a !== b) {
    fail('netlify-deploy/index.html body has drifted from output/artifact.html');
  }
}

// --- netlify-deploy: OG metadata --------------------------------------------
if (fs.existsSync(p('netlify-deploy/index.html'))) {
  const h = read('netlify-deploy/index.html');
  const og = p('netlify-deploy/og-image.png');

  if (!/<meta property="og:image" content="[^"]+"/.test(h)) fail('index.html: no og:image');
  if (h.includes('papaya-lebkuchen')) fail('index.html: stale papaya-lebkuchen domain');
  for (const k of ['og:image', 'og:url']) {
    const v = (h.match(new RegExp(`<meta property="${k}" content="([^"]+)"`)) || [])[1];
    if (v && !v.startsWith(SITE)) fail(`index.html: ${k} points at ${v}, expected ${SITE}`);
  }

  if (!fs.existsSync(og)) fail('netlify-deploy/og-image.png missing');
  else {
    const { width, height } = pngSize(og);
    const mw = +(h.match(/og:image:width" content="(\d+)"/) || [])[1];
    const mh = +(h.match(/og:image:height" content="(\d+)"/) || [])[1];
    // render:og syncs these; a mismatch means index.html was rebuilt afterwards
    if (mw !== width || mh !== height) {
      fail(`index.html: og:image meta ${mw}x${mh} != actual ${width}x${height} (re-run npm run render:og)`);
    } else notes.push(`og-image: ${width}x${height}`);
  }
}

// --- rendered PNGs -----------------------------------------------------------
const pngs = fs.existsSync(p('output'))
  ? fs.readdirSync(p('output')).filter((f) => f.endsWith('.png'))
  : [];
if (!pngs.length) fail('output/: no rendered PNG found (run npm run render:full)');
else notes.push(`png: ${pngs.sort().slice(-1)[0]}`);

// --- report -----------------------------------------------------------------
for (const n of notes) console.log(`  ${n}`);
if (failures.length) {
  console.error(`\n${failures.length} problem(s):`);
  for (const f of failures) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log('\nAll checks passed.');
