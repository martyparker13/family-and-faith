#!/usr/bin/env node
/**
 * Generates Google Play store graphics into docs/:
 *   play-icon-512.png          512×512 store icon
 *   play-feature-graphic.png   1024×500 feature graphic
 *
 * Run: node scripts/generate-store-assets.js
 */
const path = require('path');
const sharp = require('sharp');

const CREAM = '#FBF5E9';
const GOLD = '#C9973B';
const GOLD_LIGHT = '#DBAE56';
const GOLD_DEEP = '#A47A2A';
const TEXT = '#3D3225';
const MUTED = '#85765F';

/** The book + cross artwork from the app icon, in a 1024×1024 viewBox. */
function artwork() {
  return `
    <rect x="482" y="200" width="60" height="240" rx="18" fill="${GOLD_DEEP}"/>
    <rect x="402" y="268" width="220" height="60" rx="18" fill="${GOLD_DEEP}"/>
    <path d="M512 500 C 440 452, 320 444, 232 478 C 218 484, 208 496, 208 512
             L 208 742 C 208 762, 226 774, 244 768 C 330 740, 440 748, 512 792 Z"
          fill="${GOLD}"/>
    <path d="M512 500 C 584 452, 704 444, 792 478 C 806 484, 816 496, 816 512
             L 816 742 C 816 762, 798 774, 780 768 C 694 740, 584 748, 512 792 Z"
          fill="${GOLD_LIGHT}"/>
    <rect x="500" y="496" width="24" height="300" rx="12" fill="${GOLD_DEEP}"/>
  `;
}

async function main() {
  const outDir = path.join(__dirname, '..', 'docs');

  // 512×512 Play store icon — same design as the app icon.
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" fill="${CREAM}"/>
    ${artwork()}
  </svg>`;
  await sharp(Buffer.from(iconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(outDir, 'play-icon-512.png'));
  console.log('✔ docs/play-icon-512.png (512×512)');

  // 1024×500 feature graphic: artwork left, wordmark right.
  const featureSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
    <rect width="1024" height="500" fill="${CREAM}"/>
    <g transform="translate(-20 30) scale(0.45)">${artwork()}</g>
    <text x="670" y="225" font-family="Georgia, 'Times New Roman', serif" font-size="68"
          fill="${TEXT}" text-anchor="middle" font-weight="bold">Family &amp; Faith</text>
    <text x="670" y="288" font-family="Georgia, 'Times New Roman', serif" font-size="32"
          fill="${MUTED}" text-anchor="middle">The Bible in a year — together.</text>
    <rect x="540" y="328" width="260" height="6" rx="3" fill="${GOLD}"/>
  </svg>`;
  await sharp(Buffer.from(featureSvg))
    .png()
    .toFile(path.join(outDir, 'play-feature-graphic.png'));
  console.log('✔ docs/play-feature-graphic.png (1024×500)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
