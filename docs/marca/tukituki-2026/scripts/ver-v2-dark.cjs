const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    try { localStorage.setItem('tema', 'dark'); } catch (e) { /* nada */ }
  });
  const base = 'http://localhost:5173';

  const ir = async (ruta, archivo, espera = 1600) => {
    await page.goto(base + ruta, { waitUntil: 'load', timeout: 60000 });
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 5000))]);
      }
      await Promise.all(Array.from(document.images).map((img) => img.complete ? 1 : new Promise((r) => { img.onload = img.onerror = r; })));
    });
    await page.waitForTimeout(espera);
    await page.screenshot({ path: archivo, fullPage: false });
    console.log(archivo);
  };

  await ir('/para-restaurantes', 'v2/docs/marca/tukituki-2026/proceso/v2-landing-oscuro.png');
  await ir('/', 'v2/docs/marca/tukituki-2026/proceso/v2-descubrir-oscuro.png', 2400);

  await browser.close();
})();
