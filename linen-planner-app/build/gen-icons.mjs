// One-off: render PWA icons to assets/icons/ using Chromium.
// Re-run only if you change the brand mark. Build copies these into out/.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const DEEP = '#695D49', PAPER = '#F5EFE6', TINT = '#E2DACE';
await mkdir(resolve('assets/icons'), { recursive: true });
const b = await chromium.launch();

async function shot(size, maskable, out) {
  const pad = maskable ? size * 0.18 : size * 0.0;
  const radius = maskable ? 0 : size * 0.22;
  const mark = (size - pad * 2) * 0.5;
  const html = `<!doctype html><html><body style="margin:0">
  <div style="width:${size}px;height:${size}px;background:${maskable ? DEEP : 'transparent'};display:flex;align-items:center;justify-content:center">
    <div style="width:${size - pad * 2}px;height:${size - pad * 2}px;background:${DEEP};border-radius:${radius}px;display:flex;align-items:center;justify-content:center">
      <div style="font-family:serif;color:${PAPER};font-size:${mark}px;line-height:1">&#10042;</div>
    </div>
  </div></body></html>`;
  const p = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await p.setContent(html, { waitUntil: 'load' });
  await p.screenshot({ path: resolve('assets/icons', out), omitBackground: true });
  await p.close();
}

await shot(192, false, 'icon-192.png');
await shot(512, false, 'icon-512.png');
await shot(512, true, 'icon-maskable-512.png');
await b.close();
console.log('icons generated');
