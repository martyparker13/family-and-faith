#!/usr/bin/env node
/**
 * Generates all icon assets from the source foreground artwork:
 *   assets/images/android-icon-foreground.png  (source — already placed)
 *
 * Outputs:
 *   assets/images/icon.png                     1024×1024  iOS / main icon (cream bg)
 *   assets/images/splash-icon.png              96×96      Expo splash
 *   assets/images/android-icon-background.png  1024×1024  solid cream bg
 *   assets/images/android-icon-monochrome.png  1024×1024  white silhouette for Android 13+
 *   docs/play-icon-512.png                     512×512    Google Play store icon
 *
 * Run: node scripts/generate-icon.js
 */
const path  = require('path');
const sharp = require('sharp');

const CREAM_BG = { r: 253, g: 246, b: 233 }; // #FDF6E9

const A   = path.join(__dirname, '..', 'assets', 'images');
const D   = path.join(__dirname, '..', 'docs');
const SRC = path.join(A, 'android-icon-foreground.png');

async function onCream(outPath, px) {
  const buf = await sharp({ create: { width: 1024, height: 1024, channels: 3, background: CREAM_BG } })
    .composite([{ input: SRC }])
    .png()
    .toBuffer();
  let img = sharp(buf);
  if (px) img = img.resize(px, px);
  await img.png().toFile(outPath);
  log(outPath, px);
}

async function monochrome(outPath) {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // Replace every pixel's RGB with white, preserving alpha
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i + 1] = data[i + 2] = 255;
  }
  await sharp(Buffer.from(data), { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(outPath);
  log(outPath);
}

async function solidBg(outPath) {
  await sharp({ create: { width: 1024, height: 1024, channels: 3, background: CREAM_BG } })
    .png()
    .toFile(outPath);
  log(outPath);
}

function log(file, px) {
  const rel = path.relative(path.join(__dirname, '..'), file);
  console.log(`✔ ${rel}${px ? ` (${px}×${px})` : ''}`);
}

async function main() {
  await onCream(`${A}/icon.png`, 1024);
  await onCream(`${A}/favicon.png`, 64);
  await onCream(`${A}/splash-icon.png`, 96);
  await solidBg(`${A}/android-icon-background.png`);
  await monochrome(`${A}/android-icon-monochrome.png`);
  await onCream(`${D}/play-icon-512.png`, 512);
  console.log('\nAndroid foreground (source): assets/images/android-icon-foreground.png — unchanged.');
}

main().catch(err => { console.error(err); process.exit(1); });
