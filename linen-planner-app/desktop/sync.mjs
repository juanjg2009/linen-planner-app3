// Copy the freshly built planner HTML + icon into the Electron app folder.
import { mkdir, copyFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const PROJ = resolve(__dir, '..');

const html = resolve(PROJ, 'out/linen-planner.html');
try { await access(html, constants.R_OK); }
catch { console.error('! out/linen-planner.html missing. Run `npm run build:planner` in the project root first.'); process.exit(1); }

await mkdir(resolve(__dir, 'app'), { recursive: true });
await copyFile(html, resolve(__dir, 'app/linen-planner.html'));

await mkdir(resolve(__dir, 'build'), { recursive: true });
const icon = resolve(PROJ, 'assets/icons/icon-512.png');
try { await copyFile(icon, resolve(__dir, 'build/icon.png')); }
catch { console.warn('! icon missing (run: node build/gen-icons.mjs in project root)'); }

console.log('synced: app/linen-planner.html + build/icon.png');
