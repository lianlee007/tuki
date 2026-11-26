import { chromium } from '@playwright/test';
import path from 'node:path';

const carpeta = path.resolve('docs/entrega/chat-voz');
const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1240, height: 1754 } });
await pagina.emulateMedia({ media: 'print' });
await pagina.goto('file:///' + path.join(carpeta, 'documento.html').replaceAll('\\', '/'), { waitUntil: 'networkidle' });
await pagina.waitForFunction(() => Array.from(document.images).every((imagen) => imagen.complete));
await pagina.pdf({
  path: path.join(carpeta, 'voz-chat-metricas.pdf'),
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="width:100%;font-family:Segoe UI,Arial,sans-serif;font-size:8px;color:#8A7E72;padding:0 15mm;display:flex;justify-content:space-between;"><span>Voz en el chat de Tuki · métricas del chatbot</span><span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>',
  margin: { top: '14mm', bottom: '16mm', left: '15mm', right: '15mm' },
});
await navegador.close();
console.log('PDF listo');
