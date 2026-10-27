import { describe, expect, it } from 'vitest';
import {
  codigoPedido,
  dinero,
  esEstadoPedido,
  esPedidoActivo,
  etiquetaEstado,
  fechaPedido,
  itemsPedido,
  resumenItems,
  siguienteEstado,
  unidadesPedido,
  type Pedido,
} from '../../src/lib/pedidos';

const pedido = (cambios: Partial<Pedido> = {}): Pedido => ({
  id: '0f8b3f7e-1c1a-4b1a-9c1a-abcdef123456',
  restaurante_id: 'r1',
  nombre_cliente: 'Ana',
  telefono_cliente: '3001112233',
  items: [{ nombre: 'Ajiaco', cantidad: 2, precio: 20000 }],
  subtotal: 40000,
  total: 40000,
  estado: 'pendiente',
  created_at: '2026-10-12T15:00:00.000Z',
  ...cambios,
});

describe('estados del pedido', () => {
  it('reconoce solo los estados que entiende la interfaz', () => {
    expect(esEstadoPedido('pendiente')).toBe(true);
    expect(esEstadoPedido('en_camino')).toBe(true);
    expect(esEstadoPedido('volando')).toBe(false);
    expect(esEstadoPedido(null)).toBe(false);
  });

  it('etiqueta un estado desconocido sin romper la bandeja', () => {
    expect(etiquetaEstado('entregado')).toBe('Entregado');
    expect(etiquetaEstado('perdido')).toBe('Sin estado');
  });

  it('un pedido sigue activo hasta que se entrega o se cancela', () => {
    expect(esPedidoActivo(pedido())).toBe(true);
    expect(esPedidoActivo(pedido({ estado: 'en_camino' }))).toBe(true);
    expect(esPedidoActivo(pedido({ estado: 'entregado' }))).toBe(false);
    expect(esPedidoActivo(pedido({ estado: 'cancelado' }))).toBe(false);
  });

  it('avanza en orden y se detiene al final', () => {
    expect(siguienteEstado('pendiente')).toBe('confirmado');
    expect(siguienteEstado('confirmado')).toBe('en_camino');
    expect(siguienteEstado('en_camino')).toBe('entregado');
    expect(siguienteEstado('entregado')).toBeNull();
    expect(siguienteEstado('cancelado')).toBeNull();
  });
});

describe('detalle del pedido', () => {
  it('lee items ya parseados o como texto de Postgres', () => {
    expect(itemsPedido([{ nombre: 'Ajiaco', cantidad: 1, precio: 1 }])).toHaveLength(1);
    expect(itemsPedido('[{"nombre":"Ajiaco","cantidad":1,"precio":1}]')).toHaveLength(1);
    expect(itemsPedido('no-es-json')).toEqual([]);
    expect(itemsPedido(null)).toEqual([]);
  });

  it('resume los primeros platos y cuenta el resto', () => {
    const items = [
      { nombre: 'Ajiaco', cantidad: 2, precio: 1 },
      { nombre: 'Tamal', cantidad: 1, precio: 1 },
      { nombre: 'Chicha', cantidad: 3, precio: 1 },
      { nombre: 'Postre', cantidad: 1, precio: 1 },
    ];

    expect(resumenItems(items, 2)).toBe('Ajiaco ×2 · Tamal ×1 · +2');
    expect(resumenItems([], 2)).toBe('Sin detalle');
  });

  it('suma unidades con cantidades raras sin devolver NaN', () => {
    const items = [
      { nombre: 'Ajiaco', cantidad: 2, precio: 1 },
      { nombre: 'Tamal', cantidad: 'x' as unknown as number, precio: 1 },
    ];
    expect(unidadesPedido(items)).toBe(2);
  });
});

describe('presentación del pedido', () => {
  it('acorta el identificador a seis caracteres', () => {
    expect(codigoPedido('0f8b3f7e-1c1a-4b1a-9c1a-abcdef123456')).toBe('#123456');
  });

  it('formatea la fecha y tolera valores inválidos', () => {
    expect(fechaPedido('2026-10-12T15:00:00.000Z')).toContain('12 de oct');
    expect(fechaPedido('no-es-fecha')).toBe('');
    expect(fechaPedido(null)).toBe('');
  });

  it('formatea el dinero en pesos sin decimales', () => {
    expect(dinero(40000)).toBe('$40.000');
    expect(dinero('12500')).toBe('$12.500');
    expect(dinero(null)).toBe('$0');
  });
});
