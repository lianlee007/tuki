"""Genera el símbolo y los iconos de TukiTuki 2026.

Geometría maestra (lienzo 64 × 64, marca centrada):
  llama: de (30, 32.5) a (33, 8.5); 15 de ancho y 25 de alto; base apoyada
  tablero: x 12..52, y 32.5..39.5, radio 3.5
  patas:   x 18..24 y 40..46, y 39.5..51.5, radio 2
"""
BASE = r'docs/marca/tukituki-2026'

FLAME = ('M30 32.5 '
         'C27 30.5 24 26 24.5 21 '
         'C25 17 27 14 29.5 11.5 '
         'C29 14.5 30 16.5 31.5 17.5 '
         'C32 14 32 11 33 8.5 '
         'C36 12.5 39.5 16.5 39 22 '
         'C38.5 27 35.5 30.5 34 32.5 '
         'C32.7 33.5 31.3 33.5 30 32.5 Z')
TABLE = (
    '<rect x="12" y="32.5" width="40" height="7" rx="3.5"/>'
    '<rect x="18" y="39.5" width="6" height="12" rx="2"/>'
    '<rect x="40" y="39.5" width="6" height="12" rx="2"/>'
)
SYMBOL = f'<path d="{FLAME}"/>{TABLE}'

def doc(view, contenido, titulo, extra=''):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" role="img" aria-label="{titulo}">
  <title>{titulo}</title>
{extra}{contenido}
</svg>
'''

for fill, nombre in [('#C2410C', 'simbolo.svg'),
                     ('#FFFFFF', 'simbolo-blanco.svg'),
                     ('#1D1D1F', 'simbolo-monocromo.svg')]:
    open(f'{BASE}/{nombre}', 'w', encoding='utf-8').write(
        doc('0 0 64 64', f'  <g fill="{fill}">{SYMBOL}</g>', 'Símbolo de TukiTuki'))

ICONO = f'''  <rect width="64" height="64" rx="15" fill="#C2410C"/>
  <g fill="#FFFFFF" transform="translate(32 32) scale(1.12) translate(-32 -32)">
    {SYMBOL}
  </g>'''
open(f'{BASE}/icono.svg', 'w', encoding='utf-8').write(
    doc('0 0 64 64', ICONO, 'Icono de TukiTuki'))

MASKABLE = f'''  <rect width="64" height="64" fill="#C2410C"/>
  <g fill="#FFFFFF" transform="translate(32 32) scale(0.84) translate(-32 -32)">
    {SYMBOL}
  </g>'''
open(f'{BASE}/icono-maskable.svg', 'w', encoding='utf-8').write(
    doc('0 0 64 64', MASKABLE, 'Icono maskable de TukiTuki'))

FAVICON = f'''  <rect width="64" height="64" rx="13" fill="#C2410C"/>
  <g fill="#FFFFFF" transform="translate(32 32) scale(1.12) translate(-32 -32)">
    {SYMBOL}
  </g>'''
open(f'{BASE}/favicon.svg', 'w', encoding='utf-8').write(
    doc('0 0 64 64', FAVICON, 'TukiTuki'))

print('ok')

