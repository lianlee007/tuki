import { siguienteEstado } from '@tuki/dominio';
import type { EstadoPedido } from '@tuki/dominio';
import { obtenerMenu, verificarPropietario } from '../../clientes/restaurantes.cliente.js';
import {
  errorNoEncontrado,
  errorProhibido,
  errorValidacion,
} from '../../lib/errores.js';
import { calcularTotales } from '../../lib/totales.js';
import { generarWhatsappUrl } from '../../lib/whatsapp.js';
import * as repo from './pedidos.repository.js';
import type { EntradaPedidoValidada } from './pedidos.schema.js';
import type {
  ContextoAutenticacion,
  LineaGuardar,
  PedidoCreado,
} from './pedidos.types.js';

const exigirDueno = (usuario: ContextoAutenticacion) => {
  if (usuario.rol !== 'dueno' && usuario.rol !== 'superadmin') {
    throw errorProhibido('Solo el dueño del restaurante puede ver estos pedidos.');
  }
};

/** Crea el pedido y valida cada plato contra el menú vigente. */
export const crear = async (
  usuario: ContextoAutenticacion,
  entrada: EntradaPedidoValidada,
): Promise<PedidoCreado> => {
  const menu = await obtenerMenu(entrada.restauranteId);
  const porId = new Map(menu.platillos.map((plato) => [plato.id, plato]));

  const lineas: LineaGuardar[] = entrada.items.map((item) => {
    const plato = porId.get(item.platilloId);
    if (!plato || !plato.activo || !plato.disponible) {
      throw errorValidacion('Uno de los platos ya no está disponible.');
    }

    return {
      platilloId: plato.id,
      nombre: plato.nombre,
      precioUnitario: plato.precio,
      cantidad: item.cantidad,
      notas: item.notas ?? null,
      subtotal: Math.round(plato.precio * item.cantidad * 100) / 100,
    };
  });

  const { subtotal, total } = calcularTotales(lineas);
  const pedido = await repo.crear({
    restauranteId: entrada.restauranteId,
    usuarioId: usuario.usuarioId,
    nombreCliente: entrada.nombreCliente,
    telefonoCliente: entrada.telefonoCliente,
    direccionEntrega: entrada.direccionEntrega ?? null,
    tipoPedido: entrada.tipoPedido,
    notasCliente: entrada.notasCliente ?? null,
    subtotal,
    total,
    items: lineas,
  });

  const whatsappUrl = generarWhatsappUrl({
    restaurante: menu.restaurante,
    cliente: {
      nombre: entrada.nombreCliente,
      telefono: entrada.telefonoCliente,
      direccion: entrada.direccionEntrega ?? null,
    },
    items: lineas,
    total,
    tipoPedido: entrada.tipoPedido,
  });

  return { ...pedido, whatsappUrl };
};

export const mios = (usuario: ContextoAutenticacion) =>
  repo.listarPorUsuario(usuario.usuarioId);

export const porRestaurante = async (
  usuario: ContextoAutenticacion,
  restauranteId: string,
  token: string,
) => {
  exigirDueno(usuario);
  if (usuario.rol === 'dueno') {
    await verificarPropietario(restauranteId, token);
  }
  return repo.listarPorRestaurante(restauranteId);
};

export const obtener = async (
  usuario: ContextoAutenticacion,
  pedidoId: string,
  token: string,
) => {
  const pedido = await repo.buscarPorId(pedidoId);
  if (!pedido) throw errorNoEncontrado('No encontramos el pedido.');
  if (pedido.usuarioId === usuario.usuarioId) return pedido;

  exigirDueno(usuario);
  if (usuario.rol === 'dueno') {
    await verificarPropietario(pedido.restauranteId, token);
  }
  return pedido;
};

export const cambiarEstado = async (
  usuario: ContextoAutenticacion,
  pedidoId: string,
  estado: EstadoPedido,
  token: string,
) => {
  const pedido = await obtener(usuario, pedidoId, token);
  if (pedido.usuarioId === usuario.usuarioId && usuario.rol === 'cliente') {
    throw errorProhibido('Solo el restaurante puede cambiar el estado.');
  }

  const esCancelacion =
    estado === 'cancelado' && ['pendiente', 'confirmado'].includes(pedido.estado);
  if (!esCancelacion && siguienteEstado(pedido.estado) !== estado) {
    throw errorValidacion('El cambio de estado no es válido.');
  }

  const actualizado = await repo.actualizarEstado(pedidoId, estado);
  if (!actualizado) throw errorNoEncontrado('No encontramos el pedido.');
  return actualizado;
};

/** Resumen global de pedidos para superadmin. */
export const resumenAdmin = repo.resumen;
