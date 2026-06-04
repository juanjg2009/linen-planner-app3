// Manual Windows packaging — no electron-builder, no electron-packager.
// Copies the prebuilt Electron already in node_modules and injects our app.
// Works on Windows without admin / Developer Mode (no symlinks, no downloads).
import { cp, rm, rename, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pexec = promisify(execFile);
const __dir = dirname(fileURLToPath(import.meta.url));
const APPNAME = 'Linen Paper Co.';

const electronDist = resolve(__dir, 'node_modules/electron/dist');
try { await access(resolve(electronDist, 'electron.exe'), constants.R_OK); }
catch { console.error('! node_modules/electron/dist not found. Run `npm install` first.'); process.exit(1); }

const outRoot = resolve(__dir, 'dist');
const outApp = resolve(outRoot, `${APPNAME}-win32-x64`);
await rm(outApp, { recursive: true, force: true });
await mkdir(outApp, { recursive: true });

// 1) copy the Electron runtime
await cp(electronDist, outApp, { recursive: true });

// 2) remove the default placeholder app
await rm(resolve(outApp, 'resources/default_app.asar'), { force: true });

// 3) inject our app into resources/app
const appDir = resolve(outApp, 'resources/app');
await mkdir(appDir, { recursive: true });
await cp(resolve(__dir, 'main.js'), resolve(appDir, 'main.js'));
await cp(resolve(__dir, 'app'), resolve(appDir, 'app'), { recursive: true });
// minimal runtime package.json (name + main only)
const pkg = JSON.parse(await readFile(resolve(__dir, 'package.json'), 'utf8'));
await writeFile(resolve(appDir, 'package.json'),
  JSON.stringify({ name: pkg.name, productName: APPNAME, version: pkg.version, main: 'main.js' }, null, 2));

// 4) rename the launcher exe
const exe = resolve(outApp, `${APPNAME}.exe`);
await rename(resolve(outApp, 'electron.exe'), exe);

// 5) set the exe icon via rcedit if available (best-effort)
const ico = resolve(__dir, 'build/icon.ico');
const rcedit = await findRcedit();
if (rcedit) {
  try { await pexec(rcedit, [exe, '--set-icon', ico]); console.log('  exe icon set'); }
  catch (e) { console.warn('  ! rcedit icon failed: ' + e.message); }
} else { console.warn('  ! rcedit not found; exe keeps default Electron icon'); }

console.log('packaged: ' + outApp);

async function findRcedit() {
  const candidates = [
    resolve(__dir, 'node_modules/rcedit/bin/rcedit-x64.exe'),
    resolve(__dir, 'node_modules/electron-builder/node_modules/rcedit/bin/rcedit-x64.exe')
  ];
  for (const c of candidates) { try { await access(c, constants.R_OK); return c; } catch {} }
  return null;
}
