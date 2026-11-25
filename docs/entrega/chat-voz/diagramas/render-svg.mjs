import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const svgPath = process.argv[2];
const out = process.argv[3];
if (!svgPath || !out) { console.error('uso: node render-svg.mjs <svg> <png>'); process.exit(1); }
const svg = readFileSync(svgPath, 'utf8');
const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
await pagina.setContent(`<!doctype html><html><body style="margin:0;background:#FBF6EA"><div id="diagrama" style="width:1400px;height:auto">${svg}</div></body></html>`);
await pagina.waitForTimeout(500);
await pagina.locator('#diagrama').screenshot({ path: out, animations: 'disabled' });
await navegador.close();
