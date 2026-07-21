// Visual smoke test at desktop + mobile viewports.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

mkdirSync('shots', { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--window-size=1920,1080', '--mute-audio'],
});

async function run(label, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: `shots/${label}_title.png` });

  // click PLAY at ~73.5% height, centered
  await page.mouse.click(viewport.width / 2, viewport.height * 0.735);
  await new Promise((r) => setTimeout(r, 2200));

  async function swipe(x1, y1, x2, y2) {
    await page.mouse.move(x1 * viewport.width, y1 * viewport.height);
    await page.mouse.down();
    const steps = 14;
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(
        (x1 + ((x2 - x1) * i) / steps) * viewport.width,
        (y1 + ((y2 - y1) * i) / steps) * viewport.height,
      );
      await new Promise((r) => setTimeout(r, 8));
    }
    await page.mouse.up();
  }

  for (let i = 0; i < 16; i++) {
    const dir = i % 2 === 0;
    await swipe(dir ? 0.2 : 0.8, 0.7, dir ? 0.8 : 0.2, 0.4);
    await new Promise((r) => setTimeout(r, 380));
    if (i === 9) await page.screenshot({ path: `shots/${label}_play.png` });
  }

  console.log(`${label} errors:`, errors.length ? errors : 'none');
  await page.close();
}

await run('desktop', { width: 1600, height: 900 });
await run('mobile', { width: 390, height: 844, isMobile: true, hasTouch: true });

await browser.close();
