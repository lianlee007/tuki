const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const base = 'http://localhost:5173';

  const ir = async (ruta, archivo, espera = 1200) => {
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

  await ir('/para-restaurantes', 'v2/docs/marca/tukituki-2026/proceso/v2-landing.png', 1600);
  await ir('/entrar', 'v2/docs/marca/tukituki-2026/proceso/v2-entrar.png', 900);
  await ir('/ruta-que-no-existe', 'v2/docs/marca/tukituki-2026/proceso/v2-404.png', 900);
  await ir('/', 'v2/docs/marca/tukituki-2026/proceso/v2-descubrir.png', 2500);

  await browser.close();
})();
