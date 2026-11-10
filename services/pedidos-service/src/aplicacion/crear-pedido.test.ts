import { describe, expect, it, vi } from 'vitest';
import { crearPedido } from './crear-pedido.js';
import type { Pedido } from '../dominio/pedido.js';
import type { PedidosRepositorio } from '../puertos/pedidos.repositorio.js';
import type { RestaurantesCliente } from '../puertos/restaurantes.cliente.js';

const pedido: Pedido = {
  id: 'pedido-1',
  restauranteId: 'restaurante-1',
  usuarioId: 'usuario-1',
  nombreCliente: 'Ana',
  telefonoCliente: '3100000000',
  direccionEntrega: 'Calle 1',
  items: [],
  subtotal: 26000,
  total: 26000,
  estado: 'pendiente',
  tipoPedido: 'entrega',
  notasCliente: null,
  creadoEn: '2026-01-01T00:00:00.000Z',
};

const crearRepositorioFalso = (): PedidosRepositorio => ({
  crear: vi.fn(async () => pedido),
  buscarPorId: vi.fn(async () => pedido),
  listarPorUsuario: vi.fn(async () => [pedido]),
  listarPorRestaurante: vi.fn(async () => [pedido]),
  actualizarEstado: vi.fn(async () => pedido),
  resumen: vi.fn(async () => ({ total: 1, pendientes: 1, ingresos: 0 })),
});

const crearClienteFalso = (disponible = true): RestaurantesCliente => ({
  obtenerMenu: vi.fn(async () => ({
    restaurante: {
      id: 'restaurante-1',
      nombre: 'Café Bolívar',
      slug: 'cafe-bolivar',
      whatsapp: '3001234567',
      telefono: null,
    },
    platillos: [
      {
        id: 'plato-1',
        nombre: 'Capuchino',
        precio: 13000,
        disponible,
        activo: true,
      },
    ],
  })),
  verificarPropietario: vi.fn(async () => undefined),
});

const entrada = {
  restauranteId: 'restaurante-1',
  items: [{ platilloId: 'plato-1', cantidad: 2 }],
  tipoPedido: 'entrega' as const,
  nombreCliente: 'Ana',
  telefonoCliente: '3100000000',
  direccionEntrega: 'Calle 1',
};

const usuario = {
  usuarioId: 'usuario-1',
  rol: 'cliente' as const,
  email: 'ana@tukituki.local',
};

describe('crearPedido', () => {
  it('recalcula el total con el precio del menú y genera WhatsApp', async () => {
    const pedidos = crearRepositorioFalso();
    const crear = crearPedido({ pedidos, restaurantes: crearClienteFalso() });

    const resultado = await crear(usuario, entrada);

    expect(pedidos.crear).toHaveBeenCalledWith(
      expect.objectContaining({ subtotal: 26000, total: 26000 }),
    );
    expect(resultado.whatsappUrl).toContain('https://wa.me/573001234567');
  });

  it('rechaza un plato que ya no está disponible', async () => {
    const crear = crearPedido({
      pedidos: crearRepositorioFalso(),
      restaurantes: crearClienteFalso(false),
    });

    await expect(crear(usuario, entrada)).rejects.toMatchObject({
      codigo: 'validacion',
    });
  });
});
