import type React from 'react';
import type { Pedido } from '@tuki/dominio';
import { siguienteEstado } from '@tuki/dominio';
import { Boton, Etiqueta, Tarjeta } from '@tuki/ui-kit';

const ETIQUETA: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const SeccionPedidos: React.FC<{
  pedidos: Pedido[];
  onCambiarEstado: (pedidoId: string, estado: Pedido['estado']) => void;
}> = ({ pedidos, onCambiarEstado }) => (
  <Tarjeta>
    <div className="tuki-fila">
      <h2>Pedidos</h2>
      <Etiqueta>{pedidos.length}</Etiqueta>
    </div>

    <ul className="tuki-lista">
      {pedidos.map((pedido) => {
        const siguiente = siguienteEstado(pedido.estado);
        return (
          <li key={pedido.id}>
            <div className="tuki-fila">
              <strong>#{pedido.id.slice(0, 8)}</strong>
              <Etiqueta>{ETIQUETA[pedido.estado] ?? pedido.estado}</Etiqueta>
            </div>
            <p>
              {pedido.items.map((item) => `${item.cantidad}x ${item.nombre}`).join(', ')}
            </p>
            <div className="tuki-fila">
              <small>{new Date(pedido.creadoEn).toLocaleString('es-CO')}</small>
              <span className="tuki-precio">
                ${pedido.total.toLocaleString('es-CO')}
              </span>
            </div>
            {siguiente ? (
              <Boton
                type="button"
                secundario
                onClick={() => onCambiarEstado(pedido.id, siguiente)}
              >
                Marcar {ETIQUETA[siguiente]?.toLowerCase()}
              </Boton>
            ) : null}
          </li>
        );
      })}
    </ul>

    {pedidos.length === 0 ? <p>Todavía no hay pedidos.</p> : null}
  </Tarjeta>
);
