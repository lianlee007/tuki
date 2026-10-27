/**
 * Verificación del catálogo de paletas.
 *   npm run verificar:paletas
 *
 * Comprueba, para cada paleta en claro y en oscuro, que cada par de colores que
 * la interfaz usa de verdad cumple el contraste que necesita. Y mide la
 * distancia perceptiva entre paletas para confirmar que ninguna se repite.
 *
 * Es la garantía de la promesa que se le hace al dueño en el panel: cualquier
 * paleta que se añada a src/componentes/panel/paletas.ts tiene que pasar esto.
 */
import { derivarPaleta, contraste, luminancia, mezclar, acentoPanel } from '../src/lib/color.ts';
import { PALETAS, aBase, FAMILIAS } from '../src/componentes/panel/paletas.ts';

/* ---------- Lab (D65) para medir "se parecen o no" ---------- */
function aLab(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const s = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = s.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  const [r, g, b] = lin;
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(X), f(Y), f(Z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function dE76(a: string, b: string): number {
  const [l1, a1, b1] = aLab(a);
  const [l2, a2, b2] = aLab(b);
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

let fallos = 0;
let ok = 0;
const fallo = (msg: string) => {
  fallos++;
  console.log('  ✗ ' + msg);
};
const check = (cond: boolean, msg: string) => {
  if (cond) ok++;
  else fallo(msg);
};

/* ---------- Contraste de todo lo que la interfaz pinta ---------- */
const MODOS = [
  { nombre: 'claro', clave: 'claro' as const },
  { nombre: 'oscuro', clave: 'oscuro' as const },
];

console.log('\n== Contraste por paleta y modo ==\n');
for (const p of PALETAS) {
  console.log(`${p.nombre}  (${p.familia})`);
  for (const m of MODOS) {
    const c = p[m.clave];
    const d = derivarPaleta(aBase(c));
    const et = `${m.nombre}`;
    // Dirección del modo: el fondo claro debe ser claro y el oscuro, oscuro.
    if (m.clave === 'claro') check(luminancia(d.bg) > 0.6, `${et}: el fondo claro no es claro (${c.fondo})`);
    else check(luminancia(d.bg) < 0.06, `${et}: el fondo oscuro no es oscuro (${c.fondo})`);

    const pares: [string, string, string, number][] = [
      ['texto / superficie', d.text, d.surface, 4.5],
      ['texto / fondo', d.text, d.bg, 4.5],
      ['texto / tarjeta', d.text, d.cardBg, 4.5],
      ['títulos / superficie', d.title, d.surface, 4.5],
      ['secundario legible / superficie', d.muted, d.surface, 4.5],
      ['precio / fondo', d.accentText, d.bg, 4.5],
      ['precio / tarjeta', d.accentText, d.cardBg, 4.5],
      ['chip de marca (texto sobre su tinte)', d.accentText, d.accentSoft, 4.5],
      // El precio va en píldora teñida en las nueve estructuras: es el uso que
      // da oficio al Tinte de la paleta, y su tinta es la misma del chip.
      ['precio en píldora (texto sobre su tinte)', d.accentText, d.accentSoft, 4.5],
      ['relleno sólido (blanco encima)', d.accentSolid, '#FFFFFF', 4.5],
      ['apoyo legible sobre su tinte', d.secondaryText, d.secondarySoft, 4.5],
      ['alerta sobre su tinte', d.danger, d.dangerSoft, 4.5],
      ['éxito sobre su tinte', d.success, d.successSoft, 4.5],
      ['etiqueta sobre el color de marca', d.onPrimary, d.primary, 4.5],
      ['etiqueta sobre el color de apoyo', d.onSecondary, d.secondary, 4.5],
      ['línea decorativa / superficie', d.accentLine, d.surface, 2.2],
      ['marca visible sobre el fondo', d.primary, d.bg, 1.45],
    ];
    for (const [que, a, b, min] of pares) {
      const r = contraste(a, b);
      check(r >= min, `${et}: ${que} = ${r.toFixed(2)} (< ${min})  [${a} sobre ${b}]`);
    }
  }
}

/* ---------- Acento del panel (personalización del dueño) ---------- */
// El panel se pinta con el color de marca del restaurante (src/lib/color.acentoPanel).
// El panel es una superficie distinta de la página: blanco/#F2F2F7 y negro/#1C1C1E.
// Estas comprobaciones son las que garantizan que cualquier paleta del catálogo
// deja el panel legible en los dos modos.
console.log('\n== Acento del panel por paleta y modo ==\n');
const aHexTriplet = (t: string) =>
  '#' + t.split(' ').map((n) => Number(n).toString(16).padStart(2, '0')).join('');
const SUPERFICIE_PANEL = { claro: '#F2F2F7', oscuro: '#1C1C1E' };
for (const p of PALETAS) {
  for (const m of MODOS) {
    const marca = m.clave === 'claro' ? p.claro.primario : p.oscuro.primario;
    const v = acentoPanel(marca, m.nombre as 'claro' | 'oscuro');
    const tinta = aHexTriplet(v['--af-accent-rgb']);
    const tinte = aHexTriplet(v['--af-accent-soft-rgb']);
    const solido = aHexTriplet(v['--af-accent-solid-rgb']);
    const suelo = aHexTriplet(v['--af-accent-solid-hover-rgb']);
    const et = `${p.nombre} (${m.nombre})`;
    const paresPanel: [string, string, string, number][] = [
      ['acento legible / superficie del panel', tinta, SUPERFICIE_PANEL[m.nombre as 'claro' | 'oscuro'], 4.5],
      ['acento legible / su propio tinte', tinta, tinte, 4.5],
      ['relleno del panel (blanco encima)', solido, '#FFFFFF', 4.5],
      ['relleno al pasar por encima (blanco encima)', suelo, '#FFFFFF', 4.5],
    ];
    for (const [que, a, b, min] of paresPanel) {
      const r = contraste(a, b);
      check(r >= min, `${et}: ${que} = ${r.toFixed(2)} (< ${min})  [${a} sobre ${b}]`);
    }
  }
}

/* ---------- Las dos grafías del modo dan el mismo resultado ---------- */
// El contexto de tema nombra el modo en inglés ('light'/'dark') y el panel en
// castellano ('claro'/'oscuro'). Si alguien traduce a mano y se equivoca, el
// acento del panel se deriva con la rama contraria y queda oscuro sobre fondo
// oscuro (las letras del menú dejan de verse al pasar el ratón). Esta
// comprobación impide que ese fallo vuelva a colarse.
console.log('\n== Las dos grafías del modo coinciden ==\n');
const GRAFIA: [('claro' | 'oscuro'), ('light' | 'dark')][] = [['claro', 'light'], ['oscuro', 'dark']];
for (const p of PALETAS) {
  for (const [castellano, ingles] of GRAFIA) {
    const marca = castellano === 'claro' ? p.claro.primario : p.oscuro.primario;
    const a = JSON.stringify(acentoPanel(marca, castellano));
    const b = JSON.stringify(acentoPanel(marca, ingles));
    check(a === b, `${p.nombre}: acentoPanel('${castellano}') y acentoPanel('${ingles}') no coinciden`);
  }
}

/* ---------- ¿Se repiten las paletas? ---------- */
console.log('\n== Distancia perceptiva entre paletas (ΔE, menor = más parecidas) ==\n');
const paresP: { a: string; b: string; d: number }[] = [];
for (let i = 0; i < PALETAS.length; i++) {
  for (let j = i + 1; j < PALETAS.length; j++) {
    const A = PALETAS[i];
    const B = PALETAS[j];
    const dMarca = dE76(A.claro.primario, B.claro.primario);
    const dApoyo = dE76(A.claro.secundario, B.claro.secundario);
    // Distancia global: manda la marca (es lo que domina la página), pero
    // cuenta también el apoyo, que es la mitad del carácter de la paleta.
    const d = Math.sqrt(dMarca ** 2 * 0.72 + dApoyo ** 2 * 0.28);
    paresP.push({ a: A.nombre, b: B.nombre, d });
  }
}
paresP.sort((x, y) => x.d - y.d);
console.log('Los 12 pares más parecidos:');
for (const par of paresP.slice(0, 12)) {
  console.log(`  ${par.d.toFixed(1).padStart(5)}  ${par.a} ↔ ${par.b}`);
}
const min = paresP[0].d;
console.log(`\nDistancia mínima: ${min.toFixed(1)} (umbral pedido: 12)`);
check(min >= 12, `hay paletas que se parecen demasiado (ΔE ${min.toFixed(1)} < 12)`);

/* ---------- Reparto por familia ---------- */
// Una familia a la que le quedan dos paletas se ve como un fallo de la interfaz
// (un filtro que casi no cambia nada), y el reparto por familia es la primera
// pregunta que se hace el dueño al ver el selector. El mínimo protege de eso;
// por arriba, añadir más carácter a una familia no rompe nada.
console.log('\n== Reparto por familia ==');
for (const f of FAMILIAS) {
  const n = PALETAS.filter((p) => p.familia === f.id).length;
  console.log(`  ${f.id}: ${n}`);
  check(n >= 6, `${f.id} debería tener al menos 6 paletas y tiene ${n}`);
}
console.log(`\n  Total: ${PALETAS.length} paletas en ${FAMILIAS.length} familias.`);

console.log(`\n${ok} comprobaciones correctas, ${fallos} fallos.\n`);
process.exitCode = fallos > 0 ? 1 : 0;
