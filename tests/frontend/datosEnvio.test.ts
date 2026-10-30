import { describe, expect, it } from 'vitest';
import {
  DATOS_ENVIO_VACIOS,
  barrioValido,
  datosEnvioCompletos,
  direccionValida,
  erroresDatosEnvio,
  formatearDireccionEnvio,
  normalizarDatosEnvio,
  referenciasValidas,
  soloDigitos,
  telefonoValido,
} from '../../src/modulos/cuenta';

const completos = {
  telefono: '300 111 2233',
  direccion: 'Calle 5 # 10-20',
  barrio: 'Centro',
  referencias: 'Torre 2, apto 301',
};

describe('validación de los datos de envío', () => {
  it('deja el teléfono solo con dígitos', () => {
    expect(soloDigitos('+57 (300) 111-2233')).toBe('573001112233');
    expect(soloDigitos('')).toBe('');
  });

  it('exige diez dígitos para el teléfono', () => {
    expect(telefonoValido('3001112233')).toBe(true);
    expect(telefonoValido('300 111 2233')).toBe(true);
    expect(telefonoValido('300111223')).toBe(false);
    expect(telefonoValido('30011122334')).toBe(false);
  });

  it('valida dirección, barrio y referencias con sus límites', () => {
    expect(direccionValida('Calle 5 # 10-20')).toBe(true);
    expect(direccionValida('Casa')).toBe(false);
    expect(barrioValido('Centro')).toBe(true);
    expect(barrioValido('C')).toBe(false);
    expect(referenciasValidas('')).toBe(true);
    expect(referenciasValidas('x'.repeat(161))).toBe(false);
  });

  it('solo considera completa una cuenta con teléfono, dirección y barrio', () => {
    expect(datosEnvioCompletos(completos)).toBe(true);
    expect(datosEnvioCompletos({ ...completos, barrio: '' })).toBe(false);
    expect(datosEnvioCompletos({ ...completos, telefono: '123' })).toBe(false);
    expect(datosEnvioCompletos(null)).toBe(false);
    expect(datosEnvioCompletos(DATOS_ENVIO_VACIOS)).toBe(false);
  });

  it('señala cada campo que falta', () => {
    const errores = erroresDatosEnvio(DATOS_ENVIO_VACIOS);
    expect(Object.keys(errores).sort()).toEqual([
      'barrio',
      'direccion',
      'telefono',
    ]);
    expect(erroresDatosEnvio(completos)).toEqual({});
  });
});

describe('presentación de los datos de envío', () => {
  it('normaliza espacios y el teléfono antes de guardar', () => {
    expect(normalizarDatosEnvio({
      telefono: '300 111 2233',
      direccion: '  Calle 5 # 10-20 ',
      barrio: ' Centro ',
      referencias: ' Torre 2 ',
    })).toEqual({
      telefono: '3001112233',
      direccion: 'Calle 5 # 10-20',
      barrio: 'Centro',
      referencias: 'Torre 2',
    });
  });

  it('compone una sola línea para WhatsApp', () => {
    expect(formatearDireccionEnvio(completos)).toBe(
      'Calle 5 # 10-20, Centro (Torre 2, apto 301)'
    );
    expect(formatearDireccionEnvio({ ...completos, referencias: '' })).toBe(
      'Calle 5 # 10-20, Centro'
    );
    expect(formatearDireccionEnvio(DATOS_ENVIO_VACIOS)).toBe('');
  });
});
