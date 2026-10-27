import { describe, expect, it } from 'vitest';
import {
  conLuminosidad,
  contraste,
  derivarPaleta,
  hexARgb,
  luminancia,
  mezclar,
  textoSobre,
  tonoLegible,
  variablesAf,
} from '../../src/lib/color';

/**
 * Estas pruebas fijan el contrato que sostiene la legibilidad del menú público:
 * cualquier paleta que elija un restaurante debe producir texto con contraste
 * suficiente. Si alguien cambia la derivación de color y rompe WCAG, aquí falla.
 */
describe('hexARgb', () => {
  it('acepta hex de seis dígitos', () => {
    expect(hexARgb('#FF8800')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('expande hex de tres dígitos', () => {
    expect(hexARgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('devuelve negro ante un valor inválido', () => {
    expect(hexARgb('no-es-un-color')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexARgb('')).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe('contraste', () => {
  it('da la relación máxima entre blanco y negro', () => {
    expect(contraste('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });

  it('es simétrico', () => {
    expect(contraste('#123456', '#FEDCBA')).toBeCloseTo(contraste('#FEDCBA', '#123456'), 6);
  });

  it('detecta un par que no cumple AA', () => {
    expect(contraste('#FFFFFF', '#FFFF00')).toBeLessThan(4.5);
  });
});

describe('textoSobre', () => {
  it('elige tinta oscura sobre fondo claro', () => {
    expect(textoSobre('#FFFFFF')).toBe('#111111');
  });

  it('elige tinta blanca sobre fondo oscuro', () => {
    expect(textoSobre('#111111')).toBe('#FFFFFF');
  });
});

describe('mezclar y luminancia', () => {
  it('devuelve el mismo color con cantidad 0', () => {
    expect(mezclar('#336699', '#FFFFFF', 0)).toBe('#336699');
  });

  it('devuelve el destino con cantidad 1', () => {
    expect(mezclar('#336699', '#FFFFFF', 1)).toBe('#ffffff');
  });

  it('acota cantidades fuera de rango', () => {
    expect(mezclar('#336699', '#000000', 9)).toBe('#000000');
    expect(mezclar('#336699', '#000000', -2)).toBe('#336699');
  });

  it('sube la luminancia al mezclar hacia blanco', () => {
    expect(luminancia(mezclar('#333333', '#FFFFFF', 0.5))).toBeGreaterThan(luminancia('#333333'));
  });
});

describe('tonoLegible', () => {
  it('no toca un color que ya cumple', () => {
    expect(tonoLegible('#000000', '#FFFFFF')).toBe('#000000');
  });

  it('corrige un color que no cumple hasta el mínimo', () => {
    const corregido = tonoLegible('#FFFF00', '#FFFFFF', 4.5);
    expect(contraste(corregido, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('derivarPaleta', () => {
  const paletas = [
    { bg: '#FFFFFF', text: '#111111', title: '#111111', primary: '#F59E0B', secondary: '#0EA5E9' },
    { bg: '#0B0B0F', text: '#F5F5F7', title: '#FFFFFF', primary: '#F59E0B', secondary: '#0EA5E9' },
    { bg: '#FFF8E1', text: '#3E2723', title: '#2E1B12', primary: '#D4A017', secondary: '#8D6E63' },
  ];

  it.each(paletas)('mantiene el texto legible sobre la superficie ($bg)', (paleta) => {
    const d = derivarPaleta(paleta);
    expect(contraste(d.text, d.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(d.muted, d.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(paletas)('mantiene el acento legible sobre su chip ($bg)', (paleta) => {
    const d = derivarPaleta(paleta);
    expect(contraste(d.accentText, d.accentSoft)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(d.secondaryText, d.secondarySoft)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(paletas)('deja el relleno sólido apto para etiqueta blanca ($bg)', (paleta) => {
    const d = derivarPaleta(paleta);
    expect(contraste(d.accentSolid, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });

  it('detecta correctamente un fondo oscuro', () => {
    expect(derivarPaleta(paletas[1]).bgEsOscuro).toBe(true);
    expect(derivarPaleta(paletas[0]).bgEsOscuro).toBe(false);
  });
});

describe('conLuminosidad', () => {
  it('conserva el tono al forzar luminosidad', () => {
    const claro = conLuminosidad('#8B5E34', 0.8);
    expect(luminancia(claro)).toBeGreaterThan(0.4);
  });
});

describe('variablesAf', () => {
  it('publica las variables CSS que consumen las plantillas', () => {
    const vars = variablesAf({
      bg: '#FFFFFF',
      text: '#111111',
      title: '#111111',
      primary: '#0A84FF',
      secondary: '#30D158',
    });
    expect(vars['--af-ground-rgb']).toBe('255 255 255');
    expect(vars['--af-accent-solid-rgb']).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
    expect(vars['--user-primary']).toBe('#0A84FF');
  });
});
