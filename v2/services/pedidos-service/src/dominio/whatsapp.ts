import type { ItemPedido, TipoPedido } from './pedido.js';

interface DatosWhatsapp {
  restaurante: { nombre: string; whatsapp: string | null; telefono: string | null };
  cliente: { nombre: string; telefono: string; direccion: string | null };
  items: ItemPedido[];
  total: number;
  tipoPedido: TipoPedido;
}

const normalizarTelefono = (telefono: string): string => {
  const limpio = telefono.replace(/\D/g, '');
  return limpio.startsWith('57') && limpio.length > 10 ? limpio : `57${limpio}`;
};

/** Genera el enlace de WhatsApp que el comensal abre al confirmar. */
export const generarWhatsappUrl = (datos: DatosWhatsapp): string => {
  const telefono = datos.restaurante.whatsapp ?? datos.restaurante.telefono ?? '';
  const lineas = datos.items
    .map(
      (item, indice) =>
        `${indice + 1}. ${item.nombre} x${item.cantidad} — $${(
          item.precioUnitario * item.cantidad
        ).toLocaleString('es-CO')}`,
    )
    .join('\n');

  const texto = [
    `Hola ${datos.restaurante.nombre}, quiero hacer este pedido:`,
    '',
    lineas,
    '',
    `Total: $${datos.total.toLocaleString('es-CO')}`,
    `Entrega: ${datos.tipoPedido === 'recoger' ? 'Recoger en el local' : 'A domicilio'}`,
    `Cliente: ${datos.cliente.nombre}`,
    `Teléfono: ${datos.cliente.telefono}`,
    ...(datos.cliente.direccion ? [`Dirección: ${datos.cliente.direccion}`] : []),
  ].join('\n');

  return `https://wa.me/${normalizarTelefono(telefono)}?text=${encodeURIComponent(texto)}`;
};
