// Visual smoke test at desktop + mobile viewports.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

mkdirSync('shots', { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--window-size=1920,1080', '--mute-audio'],
});

// mirror of layout.ts metrics()
function uiScale(W, H) {
  return Math.min(Math.max(Math.min(W / 390, H / 780) * 1.05, 0.7), 2.2);
}

async function run(label, viewport) {
  const { width: W, height: H } = viewport;
  const s = uiScale(W, H);
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  const shot = (name) => page.screenshot({ path: `shots/${label}_${name}.png` });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const click = async (x, y) => {
    await page.mouse.click(x, y);
    await wait(900);
  };

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await wait(2500);
  await shot('title');

  // nav bar geometry (see TitleScene.buildNavBar)
  const navW = Math.min(352 * s, W - 20 * s);
  const slot = navW / 3;
  const navY = H * 0.765;

  // how to play
  await click(W / 2 - navW / 2 + slot * 0.5, navY);
  await wait(1200);
  await shot('howto');
  await click(W / 2, H * 0.935); // GOT IT -> title
  await wait(1500);

  // shop
  await click(W / 2 - navW / 2 + slot * 1.5, navY);
  await wait(1200);
  await shot('shop');
  await click(24 * s + 26 * s, 34 * s); // back -> title
  await wait(1500);

  // PLAY -> level select
  await click(W / 2, H * 0.665);
  await wait(1200);
  await shot('levels');

  // level 1 node (row 1, col 1)
  const gapX = (W - 40 * s) / 5;
  await click(20 * s + gapX / 2, H * 0.35);
  await wait(2200);

  async function swipe(x1, y1, x2, y2) {
    await page.mouse.move(x1 * W, y1 * H);
    await page.mouse.down();
    const steps = 14;
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(
        (x1 + ((x2 - x1) * i) / steps) * W,
        (y1 + ((y2 - y1) * i) / steps) * H,
      );
      await new Promise((r) => setTimeout(r, 8));
    }
    await page.mouse.up();
  }

  for (let i = 0; i < 12; i++) {
    const dir = i % 2 === 0;
    await swipe(dir ? 0.2 : 0.8, 0.7, dir ? 0.8 : 0.2, 0.4);
    await wait(380);
    if (i === 9) await shot('play');
  }

  // pause overlay
  await click(W / 2, 34 * s);
  await wait(600);
  await shot('pause');
  // resume
  await click(W / 2, H / 2 + 40 * s);
  await wait(800);

  console.log(`${label} errors:`, errors.length ? errors : 'none');
  await page.close();
}

await run('desktop', { width: 1600, height: 900 });
await run('mobile', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

await browser.close();
