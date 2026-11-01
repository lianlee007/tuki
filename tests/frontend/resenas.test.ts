import { describe, expect, it } from 'vitest';
import {
  fechaResena,
  iniciales,
  nombreCliente,
  resumenDe,
  resumenRestaurante,
  tieneRespuesta,
  validarRespuesta,
  validarResena,
  type Resena,
} from '../../src/modulos/resenas';

const resena = (cambios: Partial<Resena> = {}): Resena => ({
  id: 'r1',
  calificacion: 5,
  comentario: 'Muy bueno',
  created_at: '2026-10-12T15:00:00.000Z',
  nombre_cliente: 'Ana Pérez',
  platillo_id: null,
  aprobado: true,
  visible: true,
  ...cambios,
});

describe('resumenDe', () => {
  it('devuelve cero cuando no hay reseñas', () => {
    expect(resumenDe([])).toEqual({
      promedio: 0,
      cantidad: 0,
      distribucion: [0, 0, 0, 0, 0],
    });
  });

  it('promedia con un decimal y llena la distribución', () => {
    const resumen = resumenDe([
      resena({ calificacion: 5 }),
      resena({ calificacion: 4 }),
      resena({ calificacion: 3 }),
    ]);

    expect(resumen.promedio).toBe(4);
    expect(resumen.cantidad).toBe(3);
    expect(resumen.distribucion).toEqual([0, 0, 1, 1, 1]);
  });

  it('ignora notas fuera de rango', () => {
    const resumen = resumenDe([
      resena({ calificacion: 5 }),
      resena({ calificacion: 0 }),
      resena({ calificacion: 9 }),
    ]);

    expect(resumen.cantidad).toBe(1);
    expect(resumen.promedio).toBe(5);
  });

  it('redondea a un decimal sin arrastrar binarios', () => {
    const resumen = resumenDe([
      resena({ calificacion: 4 }),
      resena({ calificacion: 5 }),
      resena({ calificacion: 5 }),
    ]);

    expect(resumen.promedio).toBe(4.7);
  });
});

describe('resumenRestaurante', () => {
  it('prefiere las reseñas del local sobre las de platos', () => {
    const resumen = resumenRestaurante([
      resena({ calificacion: 2, platillo_id: null }),
      resena({ calificacion: 5, platillo_id: 'plato-1' }),
    ]);

    expect(resumen.promedio).toBe(2);
    expect(resumen.cantidad).toBe(1);
  });

  it('cae en todas si todavía no hay reseñas del local', () => {
    const resumen = resumenRestaurante([
      resena({ calificacion: 4, platillo_id: 'plato-1' }),
      resena({ calificacion: 5, platillo_id: 'plato-2' }),
    ]);

    expect(resumen.promedio).toBe(4.5);
    expect(resumen.cantidad).toBe(2);
  });
});

describe('presentación', () => {
  it('nunca deja el nombre vacío', () => {
    expect(nombreCliente(resena({ nombre_cliente: '  ' }))).toBe('Comensal');
    expect(nombreCliente(resena({ nombre_cliente: 'Ana' }))).toBe('Ana');
  });

  it('saca dos iniciales como máximo', () => {
    expect(iniciales('Ana María Pérez')).toBe('AM');
    expect(iniciales('  ')).toBe('C');
  });

  it('formatea la fecha en español y tolera valores inválidos', () => {
    expect(fechaResena('2026-10-12T15:00:00.000Z')).toContain('2026');
    expect(fechaResena('no-es-fecha')).toBe('');
    expect(fechaResena(null)).toBe('');
  });
});

describe('validarResena', () => {
  it('exige una nota entera entre 1 y 5', () => {
    expect(validarResena({ calificacion: 0, comentario: '', nombre: '' })).toMatch(/1 a 5/);
    expect(validarResena({ calificacion: 4.5, comentario: '', nombre: '' })).toMatch(/1 a 5/);
    expect(validarResena({ calificacion: 5, comentario: '', nombre: '' })).toBeNull();
  });

  it('limita el comentario y el nombre', () => {
    expect(
      validarResena({ calificacion: 5, comentario: 'x'.repeat(601), nombre: '' })
    ).toMatch(/600/);
    expect(
      validarResena({ calificacion: 5, comentario: '', nombre: 'x'.repeat(61) })
    ).toMatch(/60/);
  });
});

describe('validarRespuesta', () => {
  it('no deja publicar una respuesta vacía', () => {
    expect(validarRespuesta('')).toMatch(/Escribe/);
    expect(validarRespuesta('   ')).toMatch(/Escribe/);
  });

  it('acepta una respuesta normal y limita el largo', () => {
    expect(validarRespuesta('Gracias por venir.')).toBeNull();
    expect(validarRespuesta('x'.repeat(401))).toMatch(/400/);
  });
});

describe('tieneRespuesta', () => {
  it('solo cuenta una respuesta con texto', () => {
    expect(tieneRespuesta(resena())).toBe(false);
    expect(tieneRespuesta(resena({ respuesta_dueno: '   ' }))).toBe(false);
    expect(tieneRespuesta(resena({ respuesta_dueno: 'Gracias' }))).toBe(true);
  });
});
