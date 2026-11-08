import type React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { TipoPedido } from '@tuki/dominio';
import { mensajeDeError } from '@tuki/api-cliente';
import { usarAuth } from '@tuki/auth-react';
import { Boton, Entrada, MensajeError, Tarjeta } from '@tuki/ui-kit';
import { apis } from '../apis';
import { useCarrito } from '../carrito/contexto';

/** Carrito y creación del pedido. */
export const CarritoPanel: React.FC<{
  restauranteId: string;
  restauranteNombre: string;
}> = ({ restauranteId, restauranteNombre }) => {
  const { usuario } = usarAuth();
  const { items, quitar, vaciar, total } = useCarrito();
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>('entrega');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (items.length === 0) return null;

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const pedido = await apis.pedidos.crear({
        restauranteId,
        items: items.map((item) => ({
          platilloId: item.platilloId,
          cantidad: item.cantidad,
        })),
        tipoPedido,
        nombreCliente: nombre,
        telefonoCliente: telefono,
        direccionEntrega: tipoPedido === 'entrega' ? direccion : undefined,
        notasCliente: notas || undefined,
      });
      vaciar();
      window.open(pedido.whatsappUrl, '_blank', 'noopener');
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta>
      <h2>Tu pedido en {restauranteNombre}</h2>
      <ul className="tuki-lista">
        {items.map((item) => (
          <li key={item.platilloId} className="tuki-fila">
            <span>
              {item.cantidad}x {item.nombre}
            </span>
            <span>
              ${(item.precio * item.cantidad).toLocaleString('es-CO')}{' '}
              <button
                type="button"
                className="tuki-btn tuki-btn-secundario"
                onClick={() => quitar(item.platilloId)}
              >
                Quitar
              </button>
            </span>
          </li>
        ))}
      </ul>
      <p className="tuki-precio">Total: ${total.toLocaleString('es-CO')}</p>

      {!usuario ? (
        <p>
          <Link to="/entrar">Entra a tu cuenta</Link> para confirmar el pedido.
        </p>
      ) : (
        <form onSubmit={(evento) => void enviar(evento)}>
          <Entrada
            etiqueta="Nombre"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            required
          />
          <Entrada
            etiqueta="Teléfono"
            value={telefono}
            onChange={(evento) => setTelefono(evento.target.value)}
            required
          />
          <label className="tuki-campo">
            <span className="tuki-label">Entrega</span>
            <select
              className="tuki-input"
              value={tipoPedido}
              onChange={(evento) => setTipoPedido(evento.target.value as TipoPedido)}
            >
              <option value="entrega">A domicilio</option>
              <option value="recoger">Recoger en el local</option>
            </select>
          </label>
          {tipoPedido === 'entrega' ? (
            <Entrada
              etiqueta="Dirección"
              value={direccion}
              onChange={(evento) => setDireccion(evento.target.value)}
              required
            />
          ) : null}
          <Entrada
            etiqueta="Notas (opcional)"
            value={notas}
            onChange={(evento) => setNotas(evento.target.value)}
          />
          {error ? <MensajeError>{error}</MensajeError> : null}
          <Boton type="submit" disabled={enviando}>
            {enviando ? 'Creando pedido…' : 'Pedir por WhatsApp'}
          </Boton>
        </form>
      )}
    </Tarjeta>
  );
};
