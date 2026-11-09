import { errorValidacion } from '../dominio/errores.js';
import type {
  EntradaCrearPedido,
  LineaGuardar,
  PedidoCreado,
} from '../dominio/pedido.js';
import { calcularTotales } from '../dominio/totales.js';
import type { ContextoAutenticacion } from '../dominio/usuario.js';
import { generarWhatsappUrl } from '../dominio/whatsapp.js';
import type { PedidosRepositorio } from '../puertos/pedidos.repositorio.js';
import type { RestaurantesCliente } from '../puertos/restaurantes.cliente.js';

interface Dependencias {
  pedidos: PedidosRepositorio;
  restaurantes: RestaurantesCliente;
}

/**
 * Caso de uso: crear un pedido.
 *
 * Valida cada plato contra el menú vigente y recalcula los totales en el
 * servidor. No conoce Fastify ni PostgreSQL.
 */
export const crearPedido =
  ({ pedidos, restaurantes }: Dependencias) =>
  async (
    usuario: ContextoAutenticacion,
    entrada: EntradaCrearPedido,
  ): Promise<PedidoCreado> => {
    const menu = await restaurantes.obtenerMenu(entrada.restauranteId);
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
    const pedido = await pedidos.crear({
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
