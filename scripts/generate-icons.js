#!/usr/bin/env node
/**
 * Generates all app icon / splash assets from a single SVG design:
 * an open book with a cross rising from its spine, in the app's warm
 * gold-on-cream palette.
 *
 *   assets/images/icon.png                     1024×1024, cream background
 *   assets/images/android-icon-background.png  1024×1024 solid cream
 *   assets/images/android-icon-foreground.png  1024×1024 artwork, transparent,
 *                                              scaled into the adaptive safe zone
 *   assets/images/android-icon-monochrome.png  1024×1024 white artwork
 *   assets/images/splash-icon.png              512×512 artwork, transparent
 *   assets/images/favicon.png                  48×48
 *
 * Run: node scripts/generate-icons.js   (requires devDependency `sharp`)
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CREAM = '#FBF5E9';
const GOLD = '#C9973B';
const GOLD_LIGHT = '#DBAE56';
const GOLD_DEEP = '#A47A2A';

/**
 * The artwork, drawn in a 1024×1024 viewBox.
 * `mono` renders everything in a single color (for Android monochrome icons).
 */
function artwork({ mono = null } = {}) {
  const pageL = mono ?? GOLD;
  const pageR = mono ?? GOLD_LIGHT;
  const cross = mono ?? GOLD_DEEP;
  const spine = mono ?? GOLD_DEEP;
  return `
    <!-- Cross -->
    <rect x="482" y="200" width="60" height="240" rx="18" fill="${cross}"/>
    <rect x="402" y="268" width="220" height="60" rx="18" fill="${cross}"/>
    <!-- Open book -->
    <path d="M512 500
             C 440 452, 320 444, 232 478
             C 218 484, 208 496, 208 512
             L 208 742
             C 208 762, 226 774, 244 768
             C 330 740, 440 748, 512 792
             Z" fill="${pageL}"/>
    <path d="M512 500
             C 584 452, 704 444, 792 478
             C 806 484, 816 496, 816 512
             L 816 742
             C 816 762, 798 774, 780 768
             C 694 740, 584 748, 512 792
             Z" fill="${pageR}"/>
    <!-- Spine -->
    <rect x="500" y="496" width="24" height="300" rx="12" fill="${spine}"/>
  `;
}

function svg({ background = null, mono = null, scale = 1 } = {}) {
  const offset = (1 - scale) * 512;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${background ? `<rect width="1024" height="1024" fill="${background}"/>` : ''}
    <g transform="translate(${offset} ${offset}) scale(${scale})">${artwork({ mono })}</g>
  </svg>`;
}

async function render(svgString, size, outName) {
  const out = path.join(__dirname, '..', 'assets', 'images', outName);
  await sharp(Buffer.from(svgString)).resize(size, size).png().toFile(out);
  console.log(`✔ ${outName} (${size}×${size})`);
}

async function main() {
  // Main icon: artwork on cream.
  await render(svg({ background: CREAM }), 1024, 'icon.png');
  // Android adaptive: solid background + foreground scaled to the ~66% safe zone.
  await render(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${CREAM}"/></svg>`,
    1024,
    'android-icon-background.png'
  );
  await render(svg({ scale: 0.62 }), 1024, 'android-icon-foreground.png');
  await render(svg({ mono: '#FFFFFF', scale: 0.62 }), 1024, 'android-icon-monochrome.png');
  // Splash artwork (transparent; splash background color comes from app.json).
  await render(svg(), 512, 'splash-icon.png');
  await render(svg({ background: CREAM }), 48, 'favicon.png');

  // Remove unused template images so the bundle stays tidy.
  const remove = [
    'expo-badge-white.png',
    'expo-badge.png',
    'expo-logo.png',
    'logo-glow.png',
    'react-logo.png',
    'react-logo@2x.png',
    'react-logo@3x.png',
    'tutorial-web.png',
  ];
  for (const name of remove) {
    const p = path.join(__dirname, '..', 'assets', 'images', name);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`✘ removed ${name}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
