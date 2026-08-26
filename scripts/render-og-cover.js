const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const htmlPath = path.resolve(__dirname, '..', 'output', 'cover-only.html');
  const outPath = path.resolve(__dirname, '..', 'netlify-deploy', 'og-image.png');

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1 });
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });

  await page.screenshot({ path: outPath, fullPage: true });
  await browser.close();
  console.log('saved to', outPath);
})();
