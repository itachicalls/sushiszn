// One-off check: finish level 1, verify stars persist and level 2 unlocks.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

mkdirSync('shots', { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--window-size=1920,1080', '--mute-audio'],
});

const W = 390;
const H = 844;
const s = Math.min(Math.max(Math.min(W / 390, H / 780) * 1.05, 0.7), 2.2);

const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
await wait(2500);

// PLAY -> level select -> level 1
await page.mouse.click(W / 2, H * 0.665);
await wait(1500);
const gapX = (W - 40 * s) / 5;
await page.mouse.click(20 * s + gapX / 2, H * 0.35);
await wait(2200);

async function swipe(x1, y1, x2, y2) {
  await page.mouse.move(x1 * W, y1 * H);
  await page.mouse.down();
  for (let i = 1; i <= 14; i++) {
    await page.mouse.move((x1 + ((x2 - x1) * i) / 14) * W, (y1 + ((y2 - y1) * i) / 14) * H);
    await wait(8);
  }
  await page.mouse.up();
}

// swipe until the round ends (hearts or timer), max ~60s
for (let i = 0; i < 120; i++) {
  const dir = i % 2 === 0;
  await swipe(dir ? 0.15 : 0.85, 0.75, dir ? 0.85 : 0.15, 0.35);
  await wait(300);
  const state = await page.evaluate(() => localStorage.getItem('sushi-szn-save'));
  if (state && JSON.parse(state).stars?.['1'] !== undefined) break;
}
await wait(1500);
await page.screenshot({ path: 'shots/star_result.png' });

const saveData = await page.evaluate(() => localStorage.getItem('sushi-szn-save'));
console.log('save:', saveData);

// back to map to confirm unlock state
await page.reload({ waitUntil: 'networkidle2' });
await wait(2500);
await page.mouse.click(W / 2, H * 0.665);
await wait(1500);
await page.screenshot({ path: 'shots/star_map.png' });

await browser.close();
