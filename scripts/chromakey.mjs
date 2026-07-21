// One-shot pipeline: chroma-key generated sprite art to transparent PNGs,
// trim to content bounds, and resize for the game.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2];
if (!SRC) {
  console.error('usage: node chromakey.mjs <srcDir>');
  process.exit(1);
}

const OUT = 'public/assets/sushi';
const OUT_UI = 'public/assets/ui';
mkdirSync(OUT, { recursive: true });
mkdirSync(OUT_UI, { recursive: true });

// [srcFile, outFile, key, maxSize]
const jobs = [
  ['sprite_salmon.png', `${OUT}/salmon.png`, 'green', 320],
  ['sprite_tuna.png', `${OUT}/tuna.png`, 'green', 320],
  ['sprite_tamago.png', `${OUT}/tamago.png`, 'green', 320],
  ['sprite_onigiri.png', `${OUT}/onigiri.png`, 'green', 320],
  ['sprite_maki.png', `${OUT}/maki.png`, 'magenta', 320],
  ['sprite_golden.png', `${OUT}/golden.png`, 'green', 320],
  ['sprite_wasabi.png', `${OUT}/wasabi.png`, 'magenta', 320],
  ['sprite_chopsticks.png', `${OUT_UI}/chopsticks.png`, 'green', 420],
  ['sprite_soysauce.png', `${OUT}/soysauce.png`, 'green', 320],
  ['sprite_chili.png', `${OUT}/chili.png`, 'green', 320],
  ['sprite_fugu.png', `${OUT}/fugu.png`, 'green', 320],
  ['sprite_sensei.png', `${OUT_UI}/sensei.png`, 'green', 360],
  ['logo_sushiszn.png', `${OUT_UI}/logo.png`, 'green', 640],
  ['ui_heart.png', `${OUT_UI}/heart.png`, 'green', 180],
  ['ui_coin.png', `${OUT_UI}/coin.png`, 'magenta', 160],
];

function keyDistance(r, g, b, key) {
  if (key === 'green') {
    // How "pure green" is this pixel
    return Math.max(0, g - Math.max(r, b));
  }
  // magenta: r and b high, g low
  return Math.max(0, Math.min(r, b) - g);
}

async function processOne(srcFile, outFile, key, maxSize) {
  const img = sharp(path.join(SRC, srcFile)).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const HARD = 110; // fully background
  const SOFT = 45; // start of edge feather

  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    const r = data[o], g = data[o + 1], b = data[o + 2];
    const d = keyDistance(r, g, b, key);
    if (d >= HARD) {
      data[o + 3] = 0;
    } else if (d > SOFT) {
      const t = (d - SOFT) / (HARD - SOFT);
      data[o + 3] = Math.round(255 * (1 - t));
      // despill: pull the key hue out of the edge
      if (key === 'green') {
        data[o + 1] = Math.min(g, Math.round((r + b) / 2 + 20));
      } else {
        const avg = Math.round((g + g) / 2 + 20);
        data[o] = Math.min(r, avg + 60);
        data[o + 2] = Math.min(b, avg + 60);
      }
    }
    if (data[o + 3] > 24) {
      const x = i % width, y = (i / width) | 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  const pad = 6;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);

  await sharp(data, { raw: { width, height, channels } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
    .png()
    .toFile(outFile);
  console.log(`ok ${outFile}`);
}

for (const [src, out, key, size] of jobs) {
  await processOne(src, out, key, size);
}

// backgrounds: just copy + resize, no keying
const bgs = [
  ['bg_kitchen.png', 'bg.png'],
  ['bg_summer.png', 'bg_summer.png'],
  ['bg_autumn.png', 'bg_autumn.png'],
  ['bg_winter.png', 'bg_winter.png'],
];
for (const [src, out] of bgs) {
  await sharp(path.join(SRC, src))
    .resize(780, 1560, { fit: 'cover' })
    .png({ quality: 90 })
    .toFile(`${OUT_UI}/${out}`);
  console.log(`ok ${out}`);
}
