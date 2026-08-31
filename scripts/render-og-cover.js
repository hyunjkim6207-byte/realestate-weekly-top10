const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Reads the pixel dimensions out of a PNG's IHDR chunk (bytes 16..24).
function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// The cover height shifts between environments (Chrome/font differences move
// text metrics by a dozen-plus pixels), so og:image:height is written from the
// PNG we just rendered rather than left at whatever the last run produced.
function syncOgMeta(indexPath, { width, height }) {
  if (!fs.existsSync(indexPath)) return null;
  const before = fs.readFileSync(indexPath, 'utf8');
  const after = before
    .replace(/(<meta property="og:image:width" content=")\d+(")/, `$1${width}$2`)
    .replace(/(<meta property="og:image:height" content=")\d+(")/, `$1${height}$2`);
  if (after === before) return false;
  fs.writeFileSync(indexPath, after);
  return true;
}

(async () => {
  const htmlPath = path.resolve(__dirname, '..', 'output', 'cover-only.html');
  const outPath = path.resolve(__dirname, '..', 'netlify-deploy', 'og-image.png');
  const indexPath = path.resolve(__dirname, '..', 'netlify-deploy', 'index.html');

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1 });
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });

  await page.screenshot({ path: outPath, fullPage: true });
  await browser.close();
  console.log('saved to', outPath);

  const size = pngSize(outPath);
  const synced = syncOgMeta(indexPath, size);
  if (synced === null) {
    console.warn(`WARNING: ${indexPath} not found, og:image meta not synced`);
  } else {
    console.log(`og:image ${size.width}x${size.height}${synced ? ' (meta updated)' : ' (meta already correct)'}`);
  }
})();
