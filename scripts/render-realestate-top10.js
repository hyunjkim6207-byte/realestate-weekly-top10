const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

function getOutPath() {
  const dateStr = new Date().toISOString().slice(0, 10);
  return path.resolve(__dirname, '..', 'output', `부동산주간뉴스Top10_${dateStr}.png`);
}

(async () => {
  const htmlPath = path.resolve(__dirname, '..', 'output', 'report.html');
  const outPath = process.env.OUT_PATH ? path.resolve(process.env.OUT_PATH) : getOutPath();

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 600, height: 800, deviceScaleFactor: 2 });
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });

  await page.screenshot({ path: outPath, fullPage: true });
  await browser.close();
  console.log('saved to', outPath);
})();
