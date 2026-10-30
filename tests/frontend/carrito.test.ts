import { describe, expect, it } from 'vitest';
import {
  agregarItem,
  cambiarCantidad,
  claveCarrito,
  quitarItem,
  sanearCarrito,
  totalCarrito,
  type ItemCarrito,
} from '../../src/modulos/pedidos/dominio/carrito';
import type { Platillo } from '../../src/tipos/modelos';

const platillo = (id: string, restauranteId = 'r1', precio = 10000) =>
  ({ id, nombre: `Plato ${id}`, precio, restaurante_id: restauranteId }) as Platillo;

describe('carrito de pedidos', () => {
  it('acumula unidades del mismo platillo', () => {
    const primero = agregarItem([], platillo('p1'));
    const segundo = agregarItem(primero.carrito, platillo('p1'));

    expect(segundo.resultado).toBe('ok');
    expect(segundo.carrito).toHaveLength(1);
    expect(segundo.carrito[0].cantidad).toBe(2);
  });

  it('no mezcla restaurantes en un mismo carrito', () => {
    const { carrito } = agregarItem([], platillo('p1', 'r1'));
    const intento = agregarItem(carrito, platillo('p2', 'r2'));

    expect(intento.resultado).toBe('otro-restaurante');
    expect(intento.carrito).toEqual(carrito);
  });

  it('no deja bajar la cantidad por debajo de uno', () => {
    const { carrito } = agregarItem([], platillo('p1'));
    const reducido = cambiarCantidad(carrito, 'p1', -5);

    expect(reducido[0].cantidad).toBe(1);
  });

  it('quita un item y recalcula el total', () => {
    const { carrito } = agregarItem([], platillo('p1', 'r1', 12000));
    const conDos = agregarItem(carrito, platillo('p2', 'r1', 8000)).carrito;

    expect(totalCarrito(conDos)).toBe(20000);
    expect(totalCarrito(quitarItem(conDos, 'p1'))).toBe(8000);
  });

  it('descarta un carrito guardado inválido y usa una clave por usuario', () => {
    const items: ItemCarrito[] = [{ platillo: platillo('p1'), cantidad: 2 }];

    expect(sanearCarrito(items)).toHaveLength(1);
    expect(sanearCarrito([{ cantidad: 'dos' }])).toHaveLength(0);
    expect(claveCarrito('u1')).not.toBe(claveCarrito('u2'));
  });
});
