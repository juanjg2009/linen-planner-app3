// Generate build/icon.ico (Windows) + build/icon.icns (macOS) from build/icon.png.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import png2icons from 'png2icons';

const __dir = dirname(fileURLToPath(import.meta.url));
const png = readFileSync(resolve(__dir, 'build/icon.png'));
writeFileSync(resolve(__dir, 'build/icon.ico'), png2icons.createICO(png, png2icons.BILINEAR, 0, false));
writeFileSync(resolve(__dir, 'build/icon.icns'), png2icons.createICNS(png, png2icons.BILINEAR, 0));
console.log('icons: build/icon.ico + build/icon.icns');
