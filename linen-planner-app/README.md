# Linen Paper Co. — Planner web-app (en blanco)

Web-app HTML autónoma reconstruida a partir del bundle de diseño *Linen Paper Co.*
(planner digital **undated**, edición "All in One"). El cliente la abre con doble
clic y la rellena; todo lo que escribe o marca se guarda solo en su navegador.

## Build

```
npm install && npm run build:planner
```

Genera **`out/linen-planner.html`** (~1.3 MB, un solo archivo). CSS, fuentes
(woff2 en base64) y runtime van embebidos: cero llamadas de red al abrirlo.

> Las fuentes se descargan de Google Fonts en el primer build y se cachean en
> `assets/fonts/fonts-inline.css`. Builds posteriores son offline. Si la descarga
> falla, el build sigue y cae a fuentes del sistema.

## Cómo se usa el HTML

- **Abrir**: doble clic → Chrome / Safari iPad / Android, desde `file://`.
- **Navegar**: barra superior (Index · Year · Month · Week · Day · Notes),
  pestañas laterales (Style/Wellness/Self-care/Finance/Productivity), enlaces
  dentro de cada página (meses → días, semanas ‹ ›, índice → todo). Teclas
  **← / →** pasan de página si el foco no está en un campo.
- **Editar**: cualquier línea, casilla, vaso de agua o celda es interactiva.
- **Tema**: los 6 *dots* de la toolbar (o la rueda de la portada) cambian la
  paleta en vivo (Greige · Sage · Lavender · Sky · Blush · Clay). El tema se
  recuerda.
- **Exportar / Importar**: `Export` baja un `.json` con todos los datos;
  `Import` los restaura (recarga la página).
- **Reset**: `Clear page` borra solo la página activa; `Clear all` borra todo
  (ambos piden confirmación).
- **Imprimir / PDF**: `Print` (o Ctrl/Cmd+P) → cada página sale a 1080×810 px.

## Instalar como app (PWA)

El build emite, junto al HTML, los archivos PWA en `out/`:
`manifest.webmanifest`, `sw.js` (service worker, offline) e iconos
(`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`).

**Requisito**: servir `out/` por **http/https** (la instalación PWA y el service
worker NO funcionan desde `file://`). Por doble clic sigue funcionando, pero como
página normal, no como app instalable.

Probar en local:

```
npx serve out        # o: python -m http.server -d out 8000
```

Abrir `http://localhost:3000/linen-planner.html` (o el puerto que indique):

- **Escritorio (Chrome/Edge)**: icono **Instalar** en la barra de direcciones →
  se abre en ventana propia, con su icono, offline.
- **iPad/Android (Safari/Chrome)**: menú compartir → **Añadir a pantalla de
  inicio** → se abre a pantalla completa como app.

Para distribuirla de verdad: subir el contenido de `out/` a cualquier host
estático gratis (Netlify, GitHub Pages, Cloudflare Pages). La URL resultante es
instalable desde cualquier dispositivo.

> Los iconos se generan una vez con `node build/gen-icons.mjs` (usa Chromium de
> Playwright) y se cachean en `assets/icons/`. El build los copia a `out/`.
> El service worker cachea la app shell con nombre versionado `linen-planner-v1`;
> sube ese número en `build/build-planner.mjs` cuando publiques una versión nueva.

## Persistencia

`localStorage`, namespace `lp:linen-planner:<pageId>|<campo>`. Las claves van por
**nombre** de campo (no por posición), así que editar una página no contamina
otra del mismo tipo. El tema es global (`lp:theme`).

## Qué se montó y qué se dejó fuera

Montado (10 rutas del Index + portada): portada con switcher, Index/Hub,
Year at a glance, Monthly ×12, Weekly · Monday ×52, Weekly · Sunday ×52,
Daily, Habit tracker, Finance, Wellness, Productivity, Notes.

Fuera: **Stickers** (recurso para apps de PDF externas, no aplica a web
interactiva) y los **Etsy mockups** (marketing).

## Decisiones de reconstrucción (importante)

- **No había código fuente** en el bundle: solo PNGs (renders @3×). La app se
  reconstruyó leyendo esas imágenes como especificación. Tamaño de página
  **1080×810** (PNG 3240×2430 ÷ 3). Colores de paleta **muestreados** de
  `04 _ Palettes.png` (accent real por tema; tint/deep/ink derivados, ya que
  los swatches reales son tintes/sombras del accent). Por eso **no** se usa el
  pipeline jsx + esbuild del flujo original: el build genera el HTML directo
  desde `src/{tokens.js, styles.css, app.js}` (vanilla, sin React).
- **Fuentes aproximadas**: el bundle no traía las familias exactas (no había
  CSS de tokens). Se usan *Cormorant Garamond* (serif display/italics) y *Jost*
  (sans de etiquetas/inputs), que se acercan a los renders. Para cambiarlas,
  edita `FONTS` en `src/tokens.js`, borra `assets/fonts/fonts-inline.css` y
  re-buildea.
- **Volumen (lean)**: por elección de scope, el **Daily** es **una plantilla
  reutilizable** (no 365 páginas separadas) y las **secciones** (Habit, Finance,
  Wellness, Productivity) son **una instancia cada una** (no 12 mensuales).
  Monthly ×12 y Weekly ×52+52 sí se generan completos. Para volver al producto
  completo (365 días / secciones mensuales) habría que ampliar el registro de
  páginas en `src/app.js`.
- **Undated**: no hay año ni días reales mapeados, así que **no** hay botón
  "Hoy", ni resaltado de día actual, ni calendario fechado. Los sentinels
  `#today` y `#<sec>-now` resuelven a `daily` y a la primera instancia.
- **Weekly Monday y Sunday**: se mantienen ambas (rutas 03 y 04 del Index), con
  el orden de columnas correcto por variante.

## Cómo cambiar idioma / textos

El copy de las páginas y de la toolbar está en inglés (igual que el bundle).
Edita los literales en `src/app.js` (builders de página + toolbar) y re-buildea.

## Verificación

`node build/verify.mjs` (Playwright + Chromium headless contra `file://`)
comprueba: sin errores de consola ni red, navegación, persistencia por nombre
tras recarga, casillas/toggles, derivados live (finanzas, hábitos, proyectos),
auto-crecimiento del ledger y cambio de tema. `node build/shots.mjs` genera
capturas en `out/` para revisión visual.
