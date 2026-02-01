import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const svgContent = readFileSync(join(publicDir, 'icon.svg'));

// Generate 192x192
await sharp(svgContent)
  .resize(192, 192)
  .png()
  .toFile(join(publicDir, 'pwa-192x192.png'));

console.log('Generated pwa-192x192.png');

// Generate 512x512
await sharp(svgContent)
  .resize(512, 512)
  .png()
  .toFile(join(publicDir, 'pwa-512x512.png'));

console.log('Generated pwa-512x512.png');

// Generate apple touch icon (180x180)
await sharp(svgContent)
  .resize(180, 180)
  .png()
  .toFile(join(publicDir, 'apple-touch-icon.png'));

console.log('Generated apple-touch-icon.png');

// Generate favicon (32x32)
await sharp(svgContent)
  .resize(32, 32)
  .png()
  .toFile(join(publicDir, 'favicon.png'));

console.log('Generated favicon.png');

console.log('All icons generated successfully!');
