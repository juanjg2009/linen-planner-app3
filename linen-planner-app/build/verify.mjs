import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const file = pathToFileURL(resolve('out/linen-planner.html')).href;
const errs = [], nets = [];
const b = await chromium.launch();
const pg = await b.newPage();
pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
pg.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
pg.on('request', (r) => { const u = r.url(); if (!u.startsWith('file:') && !u.startsWith('data:') && !u.startsWith('blob:')) nets.push(u); });

const R = [];
const ok = (n, c) => R.push((c ? 'PASS' : 'FAIL') + '  ' + n);
const setCheck = (sel) => pg.evaluate((s) => { const e = document.querySelector(s); e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }, sel);

await pg.goto(file, { waitUntil: 'load' });
await pg.waitForTimeout(300);

// 1 console/network
ok('no console errors', errs.length === 0);
ok('no external network', nets.length === 0);

// 2 cover active, theme name shown
ok('cover active on load', await pg.locator('#pg-cover.is-active').count() === 1);
ok('theme name populated', (await pg.locator('.js-theme-name').first().innerText()).trim().length > 0);

// 3 navigation: index -> finance
await pg.evaluate(() => location.hash = '#index');
await pg.waitForTimeout(150);
ok('index built & active', await pg.locator('#pg-index.is-active').count() === 1);
await pg.locator('#pg-index .dir a[href="#finance"]').click();
await pg.waitForTimeout(150);
ok('nav to finance works', await pg.locator('#pg-finance.is-active').count() === 1);

// 4 toolbar label has no X/Y counter
const label = await pg.locator('#tb-label').innerText();
ok('no linear counter in label', !/\d+\s*\/\s*\d+/.test(label));

// 5 text field persists
await pg.locator('#pg-finance [name="note"]').fill('review subs');
// 6 finance derived: add expense + income
await pg.locator('#pg-finance [name="r0amt"]').fill('-50');
await pg.locator('#pg-finance [name="r0cat"]').fill('Food');
await pg.locator('#pg-finance [name="r1amt"]').fill('2000');
await pg.waitForTimeout(150);
ok('finance IN live', (await pg.locator('#pg-finance .lp-fin-in').innerText()) === '2,000');
ok('finance OUT live', (await pg.locator('#pg-finance .lp-fin-out').innerText()) === '50');
ok('finance LEFT live', (await pg.locator('#pg-finance .lp-fin-left').innerText()) === '1,950');
ok('finance balance live', (await pg.locator('#pg-finance .lp-fin-bal').innerText()) === '+1,950');
ok('category spent live (Food)', (await pg.locator('#pg-finance .lp-catspent[data-i="1"]').innerText()) === '50');

// 7 ledger autogrow
const beforeRows = await pg.locator('#pg-finance .lrow').count();
await pg.locator('#pg-finance [name="r' + (beforeRows - 1) + 'desc"]').fill('x');
await pg.waitForTimeout(120);
ok('ledger autogrows', (await pg.locator('#pg-finance .lrow').count()) === beforeRows + 1);

// 8 checkbox custom toggle + habit derived
await pg.evaluate(() => location.hash = '#habit');
await pg.waitForTimeout(150);
await pg.locator('#pg-habit [name="hname0"]').fill('Water');
await setCheck('#pg-habit [name="h0d1"]');
await setCheck('#pg-habit [name="h0d2"]');
await pg.waitForTimeout(120);
ok('habit row sum live', (await pg.locator('#pg-habit .lp-hsum[data-i="0"]').innerText()) === '2');
ok('habit streak live', (await pg.locator('#pg-habit .lp-streak').innerText()) === '2');

// 9 productivity progress
await pg.evaluate(() => location.hash = '#productivity');
await pg.waitForTimeout(150);
await setCheck('#pg-productivity [name="p0ph0"]');
await setCheck('#pg-productivity [name="p0ph1"]');
await setCheck('#pg-productivity [name="p0ph2"]');
await pg.waitForTimeout(120);
ok('productivity % live (3/6=50%)', (await pg.locator('#pg-productivity .lp-projpct[data-i="0"]').innerText()) === '50%');

// 10 theme switch via toolbar dot
const before = await pg.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--c-deep').trim());
await pg.locator('#lp-toolbar .dot[data-theme="sky"]').click();
await pg.waitForTimeout(120);
const after = await pg.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--c-deep').trim());
ok('theme switch changes --c-deep', before !== after && after.length > 0);
ok('theme name updated', (await pg.locator('.js-theme-name').first().innerText()).trim() === 'Sky');

// 11 weekly pages exist (both Mon and Sun)
await pg.evaluate(() => location.hash = '#wsun-52');
await pg.waitForTimeout(150);
ok('weekly sunday week52 builds', await pg.locator('#pg-wsun-52.is-active').count() === 1);

// 12 persistence across reload (by name)
await pg.reload({ waitUntil: 'load' });
await pg.waitForTimeout(250);
await pg.evaluate(() => location.hash = '#finance');
await pg.waitForTimeout(200);
ok('text persists after reload', (await pg.locator('#pg-finance [name="note"]').inputValue()) === 'review subs');
ok('finance derived restored', (await pg.locator('#pg-finance .lp-fin-left').innerText()) === '1,950');
await pg.evaluate(() => location.hash = '#habit');
await pg.waitForTimeout(200);
ok('checkbox persists after reload', await pg.locator('#pg-habit [name="h0d1"]').isChecked());
ok('theme persisted after reload', (await pg.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'sky');

// 13 page count sanity
const pageCount = await pg.evaluate(() => window.TOKENS && document.querySelectorAll('.lp-page').length);
ok('pages built lazily (>0)', pageCount > 0);

// screenshots
await pg.evaluate(() => location.hash = '#daily');
await pg.waitForTimeout(200);
await pg.screenshot({ path: 'out/_shot-daily.png' });
await pg.evaluate(() => location.hash = '#finance');
await pg.waitForTimeout(200);
await pg.screenshot({ path: 'out/_shot-finance.png' });

console.log('\n' + R.join('\n'));
console.log('\nconsole errors:', errs.length, errs.slice(0, 5));
console.log('external requests:', nets.length, nets.slice(0, 5));
const fails = R.filter((r) => r.startsWith('FAIL')).length;
await b.close();
process.exit(fails ? 1 : 0);
