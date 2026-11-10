"""Compone los lockups horizontal y apilado a partir del símbolo y el logotipo."""
import re

BASE = r'docs/marca/tukituki-2026'

SYMBOL = ('<path d="M30 32.5 C27 30.5 24 26 24.5 21 C25 17 27 14 29.5 11.5 '
          'C29 14.5 30 16.5 31.5 17.5 C32 14 32 11 33 8.5 '
          'C36 12.5 39.5 16.5 39 22 C38.5 27 35.5 30.5 34 32.5 '
          'C32.7 33.5 31.3 33.5 30 32.5 Z"/>'
          '<rect x="12" y="32.5" width="40" height="7" rx="3.5"/>'
          '<rect x="18" y="39.5" width="6" height="12" rx="2"/>'
          '<rect x="40" y="39.5" width="6" height="12" rx="2"/>')

def leer_logo(ruta):
    txt = open(ruta, encoding='utf-8').read()
    d = re.search(r'<path[^>]*\sd="([^"]+)"', txt).group(1)
    vb = re.search(r'viewBox="([^"]+)"', txt).group(1)
    x, y, w, h = [float(v) for v in vb.split()]
    return d, x, y, w, h

def lockup_horizontal(fill, nombre):
    d, x, y, w, h = leer_logo(f'{BASE}/logotipo.svg')
    escala_texto = 0.045
    escala_simbolo = 1.10
    baseline = 51.5
    tx = 54 + 9  # borde visible del símbolo escalado + aire
    ancho = tx + w * escala_texto + 4
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {ancho:.1f} 64" role="img" aria-label="Tuki">
  <title>Tuki</title>
  <g fill="{fill}">
    <g transform="translate(32 32) scale({escala_simbolo}) translate(-32 -32) translate(0 -2.0)">
      {SYMBOL}
    </g>
    <g transform="translate({tx} {baseline}) scale({escala_texto})">
      <path d="{d}"/>
    </g>
  </g>
</svg>
'''
    open(f'{BASE}/{nombre}', 'w', encoding='utf-8').write(svg)
    print(nombre, f'{ancho:.1f} x 64')

def lockup_apilado(fill, nombre):
    d, x, y, w, h = leer_logo(f'{BASE}/logotipo.svg')
    escala_texto = 0.046
    escala_simbolo = 1.20
    ancho_logo = w * escala_texto
    alto_cap = 757 * escala_texto
    lienzo = 172
    tx = (lienzo - ancho_logo) / 2 - x * escala_texto
    # Borde inferior visible del símbolo escalado: 32 + (51.5-32)*1.20
    borde_simbolo = 32 + (51.5 - 32) * escala_simbolo
    baseline = borde_simbolo + 8 + alto_cap
    alto = baseline + 10
    sx = lienzo / 2 - 32
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {lienzo} {alto:.0f}" role="img" aria-label="Tuki">
  <title>Tuki</title>
  <g fill="{fill}">
    <g transform="translate({sx:.1f} 0) translate(32 32) scale({escala_simbolo}) translate(-32 -32)">
      {SYMBOL}
    </g>
    <g transform="translate({tx:.1f} {baseline:.1f}) scale({escala_texto})">
      <path d="{d}"/>
    </g>
  </g>
</svg>
'''
    open(f'{BASE}/{nombre}', 'w', encoding='utf-8').write(svg)
    print(nombre, f'{lienzo} x {alto:.0f}')

lockup_horizontal('#C2410C', 'marca-horizontal.svg')
lockup_horizontal('#FFFFFF', 'marca-horizontal-blanco.svg')
lockup_apilado('#C2410C', 'marca-apilada.svg')
lockup_apilado('#FFFFFF', 'marca-apilada-blanco.svg')

