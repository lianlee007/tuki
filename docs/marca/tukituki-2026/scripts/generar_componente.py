"""Genera el archivo de trazados del logotipo para el componente React."""
import re

BASE = r'docs/marca/tukituki-2026'
OUT = r'packages/experiencia-tuki/src/componentes/sistema-diseno/marca-trazados.ts'

def leer(nombre):
    s = open(f'{BASE}/{nombre}', encoding='utf-8').read()
    d = re.search(r'<path[^>]*\sd="([^"]+)"', s).group(1)
    vb = re.search(r'viewBox="([^"]+)"', s).group(1)
    x, y, w, h = [float(v) for v in vb.split()]
    return d, vb, w, h

tuki, vb_tuki, w_tuki, h_tuki = leer('logotipo.svg')
tukituki, vb_tukituki, w_tukituki, h_tukituki = leer('logotipo-tukituki.svg')

doc = f'''/**
 * Trazados del logotipo de TukiTuki 2026.
 *
 * Generado desde `docs/marca/tukituki-2026/`; no editar a mano.
 * La llama que sustituye al punto de la «i» ya viene incluida en el trazado.
 */
export const VIEWBOX_TUKI = '{vb_tuki}';
export const VIEWBOX_TUKITUKI = '{vb_tukituki}';

export const ASPECTO_TUKI = {w_tuki / h_tuki:.6f};
export const ASPECTO_TUKITUKI = {w_tukituki / h_tukituki:.6f};

export const TRAZADO_TUKI =
  '{tuki}';

export const TRAZADO_TUKITUKI =
  '{tukituki}';
'''
open(OUT, 'w', encoding='utf-8').write(doc)
print('escrito', OUT, len(doc))

