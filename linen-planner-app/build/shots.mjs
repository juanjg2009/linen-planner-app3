import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const file = pathToFileURL(resolve('out/linen-planner.html')).href;
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1280, height: 760 } });
await pg.goto(file, { waitUntil: 'load' });
for (const id of ['cover', 'index', 'month-01', 'finance', 'wellness', 'productivity', 'habit', 'wmon-01', 'year', 'notes']) {
  await pg.evaluate((h) => location.hash = '#' + h, id);
  await pg.waitForTimeout(250);
  await pg.screenshot({ path: 'out/_s-' + id + '.png' });
}
await b.close();
console.log('done');
