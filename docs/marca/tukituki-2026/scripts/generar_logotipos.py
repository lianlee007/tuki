"""Genera los logotipos «Tuki» y «TukiTuki» como trazados, con la llama en la «i»."""
import re
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.misc.transform import Transform

FUENTE = r'docs/marca/tukituki-2026/fuentes/PlusJakartaSans-ExtraBold.ttf'
BASE = r'docs/marca/tukituki-2026'

FLAME = ('M30 32.5 C27 30.5 24 26 24.5 21 C25 17 27 14 29.5 11.5 '
         'C29 14.5 30 16.5 31.5 17.5 C32 14 32 11 33 8.5 '
         'C36 12.5 39.5 16.5 39 22 C38.5 27 35.5 30.5 34 32.5 '
         'C32.7 33.5 31.3 33.5 30 32.5 Z')

f = TTFont(FUENTE)
gs = f.getGlyphSet()
cmap = f.getBestCmap()

AVANCES = {'T': 552, 'u': 599, 'k': 586, '\u0131': 238}
KERN = {
    ('T', 'u'): -25, ('u', 'k'): -45, ('k', '\u0131'): -25,
    ('\u0131', 'T'): 60,
}

TOKEN = re.compile(r'([MCLQZ])([^MCLQZ]*)')

def transformar(d, tx, ty, sx, sy):
    salida = []
    for m in TOKEN.finditer(d):
        cmd, body = m.group(1), m.group(2)
        if cmd == 'Z':
            salida.append('Z')
            continue
        coords = [float(n) for n in re.findall(r'-?\d*\.?\d+', body)]
        puntos = []
        for i in range(0, len(coords) - 1, 2):
            puntos.append(f'{tx + coords[i] * sx:.2f} {ty + coords[i + 1] * sy:.2f}')
        salida.append(cmd + ' ' + ' '.join(puntos))
    return ' '.join(salida)

def llama_punto(x0):
    # La llama mide 15 × 25 en el lienzo 64; en la «i» mide 165 × 250.
    tx = x0 + 119 - 32 * 11
    ty = -930
    return transformar(FLAME, tx, ty, 11, 10)

def limites(gn):
    bp = BoundsPen(gs)
    gs[gn].draw(bp)
    return bp.bounds

def componer(texto):
    letras = list(texto)
    posiciones = []
    x = 0
    anterior = None
    for i, ch in enumerate(letras):
        if i > 0:
            x += KERN.get((anterior, ch), 0)
        posiciones.append((ch, x))
        x += AVANCES[ch]
        anterior = ch

    partes = []
    x0s, x1s, y0s, y1s = [], [], [], []
    for ch, x0 in posiciones:
        gn = cmap[ord(ch)]
        bx0, by0, bx1, by1 = limites(gn)
        x0s.append(x0 + bx0); x1s.append(x0 + bx1)
        y0s.append(-by1); y1s.append(-by0)
        spen = SVGPathPen(gs, ntos=lambda v: f'{v:.2f}')
        tpen = TransformPen(spen, Transform(1, 0, 0, -1, x0, 0))
        gs[gn].draw(tpen)
        partes.append(spen.getCommands())

    for ch, x0 in posiciones:
        if ch != '\u0131':
            continue
        partes.append(llama_punto(x0))
        # Caja de la llama: 165 × 250, base en -595, punta en -845.
        x0s.append(x0 + 36.5); x1s.append(x0 + 201.5)
        y0s.append(-845); y1s.append(-595)

    return ' '.join(partes), (min(x0s), max(x1s)), (min(y0s), max(y1s))

def svg(texto, fill, ruta):
    path, (x0, x1), (y0, y1) = componer(texto)
    pad = 24
    w = x1 - x0 + pad * 2
    h = y1 - y0 + pad * 2
    doc = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0-pad:.0f} {y0-pad:.0f} {w:.0f} {h:.0f}" role="img" aria-label="{texto.replace('\u0131', 'i')}">
  <title>{texto.replace('\u0131', 'i')}</title>
  <path fill="{fill}" d="{path}"/>
</svg>
'''
    open(f'{BASE}/{ruta}', 'w', encoding='utf-8').write(doc)
    print(ruta, 'viewBox', x0-pad, y0-pad, w, h)

svg('Tuk\u0131', '#C2410C', 'logotipo.svg')
svg('Tuk\u0131', '#FFFFFF', 'logotipo-blanco.svg')
svg('Tuk\u0131Tuk\u0131', '#C2410C', 'logotipo-tukituki.svg')
svg('Tuk\u0131Tuk\u0131', '#FFFFFF', 'logotipo-tukituki-blanco.svg')

