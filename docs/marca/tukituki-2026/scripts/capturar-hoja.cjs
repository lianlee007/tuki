const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
    deviceScaleFactor: 1.25,
  });
  await page.goto('http://127.0.0.1:4174/tukituki-2026/hoja-de-marca.html', {
    waitUntil: 'load',
    timeout: 60000,
  });
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 8000))]);
    }
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; })
      )
    );
  });
  await page.waitForTimeout(600);
  await page.screenshot({
    path: 'v2/docs/marca/tukituki-2026/marca-tukituki-2026.png',
    fullPage: true,
  });
  await browser.close();
  console.log('ok');
})();
