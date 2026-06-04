// Build the standalone Linen Paper Co. planner HTML.
// No .jsx source existed in the bundle (PNG renders only), so this generates
// the web-app directly from src/{tokens.js,styles.css,app.js}. No React/esbuild.
import { readFile, writeFile, mkdir, access, copyFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { PAGE_W, PAGE_H, PAPER, THEMES, DEFAULT_THEME, FONTS } from '../src/tokens.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');
const OUT_DIR = resolve(ROOT, 'out');
const FONT_CACHE = resolve(ROOT, 'assets/fonts/fonts-inline.css');
const DOC_ID = 'linen-planner';

// ---------- color math ----------
const hex2rgb = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const rgb2hex = (r) => '#' + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, i) => v * (1 - t) + B[i] * t)); };

function themeVars(mid) {
  return {
    tint: mix(mid, PAPER, 0.82),
    mid: mid,
    deep: mix(mid, '#241C14', 0.32),
    ink: mix('#2A2118', mid, 0.10)
  };
}
function themeCSS() {
  let css = '';
  const def = themeVars(THEMES.find((t) => t.id === DEFAULT_THEME).mid);
  css += `:root{--c-tint:${def.tint};--c-mid:${def.mid};--c-deep:${def.deep};--c-ink:${def.ink};}\n`;
  for (const t of THEMES) {
    const v = themeVars(t.mid);
    css += `html[data-theme="${t.id}"]{--c-tint:${v.tint};--c-mid:${v.mid};--c-deep:${v.deep};--c-ink:${v.ink};}\n`;
  }
  return css;
}

// ---------- fonts ----------
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
function gfUrl() {
  const fams = FONTS.map((f) => {
    const fam = f.family.replace(/ /g, '+');
    if (f.italic) {
      const w = f.weights.split(';');
      const axis = w.map((x) => `0,${x}`).concat(w.map((x) => `1,${x}`)).join(';');
      return `family=${fam}:ital,wght@${axis}`;
    }
    return `family=${fam}:wght@${f.weights}`;
  }).join('&');
  return `https://fonts.googleapis.com/css2?${fams}&display=swap`;
}
async function fetchFontsInline() {
  // use cache if present (offline-friendly)
  try { await access(FONT_CACHE, constants.R_OK); return await readFile(FONT_CACHE, 'utf8'); } catch {}
  try {
    const cssRes = await fetch(gfUrl(), { headers: { 'User-Agent': UA } });
    if (!cssRes.ok) throw new Error('css ' + cssRes.status);
    let css = await cssRes.text();
    const urls = [...new Set([...css.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)].map((m) => m[1]))];
    for (const u of urls) {
      const r = await fetch(u, { headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error('font ' + r.status);
      const b64 = Buffer.from(await r.arrayBuffer()).toString('base64');
      css = css.split(u).join(`data:font/woff2;base64,${b64}`);
    }
    await mkdir(dirname(FONT_CACHE), { recursive: true });
    await writeFile(FONT_CACHE, css, 'utf8');
    console.log(`  fonts: ${urls.length} woff2 inlined -> cached`);
    return css;
  } catch (e) {
    console.warn('  ! font download failed (' + e.message + '); falling back to system fonts');
    return '/* font download failed; relying on system font fallback */\n';
  }
}

// ---------- assemble ----------
async function main() {
  const [styles, app] = await Promise.all([
    readFile(resolve(ROOT, 'src/styles.css'), 'utf8'),
    readFile(resolve(ROOT, 'src/app.js'), 'utf8')
  ]);
  const fonts = await fetchFontsInline();
  const tokensJSON = JSON.stringify({
    PAGE_W, PAGE_H, DEFAULT_THEME,
    THEMES: THEMES.map((t) => ({ id: t.id, name: t.name, mid: t.mid, pantone: t.pantone }))
  });

  const html = `<!doctype html>
<html lang="en" data-theme="${DEFAULT_THEME}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes">
<title>Linen Paper Co. — All in One</title>
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="${PAPER}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Linen Planner">
<link rel="apple-touch-icon" href="icon-192.png">
<link rel="icon" type="image/png" href="icon-192.png">
<style>
${fonts}
${themeCSS()}
${styles}
</style>
</head>
<body>
<div id="lp-toolbar"></div>
<div id="lp-fit"><div id="lp-stage"></div></div>
<script>window.TOKENS=${tokensJSON};</script>
<script>
if('serviceWorker' in navigator && location.protocol.indexOf('http')===0){
  window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
}
</script>
<script>
${app}
</script>
</body>
</html>`;

  await mkdir(OUT_DIR, { recursive: true });
  const outFile = resolve(OUT_DIR, DOC_ID + '.html');
  await writeFile(outFile, html, 'utf8');
  const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
  console.log(`  built ${outFile} (${kb} KB)`);

  await emitPWA();
}

// ---------- PWA: manifest + service worker + icons ----------
async function emitPWA() {
  const icons = ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
  let haveIcons = true;
  for (const ic of icons) {
    try { await copyFile(resolve(ROOT, 'assets/icons', ic), resolve(OUT_DIR, ic)); }
    catch { haveIcons = false; }
  }
  if (!haveIcons) console.warn('  ! icons missing (run: node build/gen-icons.mjs)');

  const manifest = {
    name: 'Linen Paper Co. — All in One',
    short_name: 'Linen Planner',
    description: 'Undated digital planner.',
    start_url: DOC_ID + '.html',
    scope: './',
    display: 'standalone',
    orientation: 'any',
    background_color: PAPER,
    theme_color: PAPER,
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  };
  await writeFile(resolve(OUT_DIR, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2), 'utf8');

  const CACHE = 'linen-planner-v1';
  const shell = [DOC_ID + '.html', 'manifest.webmanifest', ...icons];
  const sw = `// Linen Paper Co. service worker — offline app shell
const CACHE = '${CACHE}';
const SHELL = ${JSON.stringify(shell)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    const copy = res.clone();
    caches.open(CACHE).then((c) => { try { c.put(e.request, copy); } catch (x) {} });
    return res;
  }).catch(() => caches.match('${DOC_ID}.html'))));
});
`;
  await writeFile(resolve(OUT_DIR, 'sw.js'), sw, 'utf8');
  console.log('  PWA: manifest.webmanifest, sw.js, ' + icons.length + ' icons emitted');
}
main().catch((e) => { console.error(e); process.exit(1); });
