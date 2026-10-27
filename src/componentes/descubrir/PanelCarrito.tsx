import React, { useEffect, useState } from 'react';
// @ts-ignore — react-router-dom no publica tipos en este proyecto.
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { useStoreCarrito } from '../../store/storeCarrito';
import { apiDescubrir } from '../../api/apiDescubrir';
import { apiWhatsApp } from '../../api/misApis';
import { apiPedidos } from '../../api/apiPedidos';
import { apiCuenta } from '../../api/apiCuenta';
import { formatearPrecio } from '../../lib/utils';
import { datosEnvioCompletos, formatearDireccionEnvio } from '../../lib/datosEnvio';
import { Hoja } from './Hoja';

interface PanelCarritoProps {
  abierto: boolean;
  onCerrar: () => void;
}

interface Contacto {
  nombre: string;
  whatsapp: string | null;
  telefono: string | null;
}

interface DireccionGuardada {
  via?: string;
  n1?: string;
  n2?: string;
  n3?: string;
  barrio?: string;
  complemento?: string;
}

/** Mismo formato que usa el menú del restaurante para sus direcciones guardadas. */
const formatearDireccion = (direccion: DireccionGuardada) =>
  [
    direccion.via,
    direccion.n1,
    direccion.n2 ? `#${direccion.n2}-${direccion.n3 ?? ''}` : '',
    direccion.barrio,
    direccion.complemento,
  ]
    .filter((parte) => Boolean(parte && String(parte).trim()))
    .join(' ');

/**
 * El carrito de Descubrir.
 *
 * Es de un solo restaurante —el que cocina el pedido— y se cierra por WhatsApp,
 * igual que el menú público. Los datos de contacto y la primera dirección se
 * comparten con el menú del restaurante: quien ya pidió una vez no los repite.
 */
export const PanelCarrito: React.FC<PanelCarritoProps> = ({ abierto, onCerrar }) => {
  const { user } = useAuth();
  const carrito = useStoreCarrito((estado) => estado.carrito);
  const actualizarCantidad = useStoreCarrito((estado) => estado.actualizarCantidad);
  const eliminarItem = useStoreCarrito((estado) => estado.eliminarItem);
  const vaciarCarrito = useStoreCarrito((estado) => estado.vaciarCarrito);

  const total = carrito.reduce((suma, item) => suma + item.platillo.precio * item.cantidad, 0);
  const restauranteId = carrito[0]?.platillo.restaurante_id;
  const restauranteNombre = carrito[0]?.restaurante_nombre;

  const [contacto, setContacto] = useState<Contacto | null>(null);
  const [cargandoContacto, setCargandoContacto] = useState(false);
  const [errorContacto, setErrorContacto] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tieneDatosGuardados, setTieneDatosGuardados] = useState(false);

  const usuarioId = user?.id;
  const nombreCuentaMeta =
    [user?.user_metadata?.nombre, user?.user_metadata?.apellido]
      .filter(Boolean)
      .join(' ')
      .trim();
  const correoCuenta = user?.email ?? '';

  /* El teléfono solo se pide cuando hay un carrito abierto. */
  useEffect(() => {
    if (!abierto || !restauranteId) {
      setContacto(null);
      return;
    }

    let vigente = true;
    setCargandoContacto(true);
    setErrorContacto(null);

    apiDescubrir.contacto(restauranteId).then(({ contacto: datos, error: fallo }) => {
      if (!vigente) return;
      setContacto(datos);
      setErrorContacto(fallo ? 'No pudimos cargar los datos del restaurante.' : null);
      setCargandoContacto(false);
    });

    return () => {
      vigente = false;
    };
  }, [abierto, restauranteId]);

  /* Precarga lo que el comensal ya guardó en cualquier menú de Tuki. */
  useEffect(() => {
    if (!abierto || !usuarioId) return;

    try {
      const basico = JSON.parse(localStorage.getItem(`tuki_user_basic_${usuarioId}`) || 'null');
      if (basico) {
        setNombre(basico.nombre ?? '');
        setTelefono(basico.telefono ?? '');
      }

      const direcciones = JSON.parse(localStorage.getItem(`tuki_addresses_${usuarioId}`) || '[]');
      if (Array.isArray(direcciones) && direcciones.length > 0) {
        setDireccion(formatearDireccion(direcciones[0]));
      }
    } catch {
      // Si lo guardado está corrupto se empieza con los campos vacíos.
    }
  }, [abierto, usuarioId]);

  /* La cuenta es la fuente que sobrevive al cambio de navegador. Lo que ya
     haya en localStorage tiene prioridad; los huecos se rellenan con la cuenta. */
  useEffect(() => {
    if (!abierto || !usuarioId) {
      setTieneDatosGuardados(false);
      return;
    }

    let vigente = true;
    const nombreCuenta = nombreCuentaMeta || correoCuenta.split('@')[0] || '';

    apiCuenta
      .datosEnvio(usuarioId)
      .then(({ datos }) => {
        if (!vigente || !datos) return;

        const completo = datosEnvioCompletos(datos);
        setTieneDatosGuardados(completo);
        setNombre((previo) => (previo.trim() ? previo : nombreCuenta));
        setTelefono((previo) => (previo.trim() ? previo : datos.telefono));

        if (completo) {
          setDireccion((previa) =>
            previa.trim() ? previa : formatearDireccionEnvio(datos)
          );
        }
      })
      .catch(() => undefined);

    return () => {
      vigente = false;
    };
  }, [abierto, usuarioId, nombreCuentaMeta, correoCuenta]);

  const pedir = () => {
    if (!contacto) return;

    const numero = (contacto.whatsapp || contacto.telefono || '').replace(/\D/g, '');
    if (!numero) {
      setError('Este restaurante todavía no tiene un número para pedidos.');
      return;
    }
    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) {
      setError('Completa tu nombre, teléfono y dirección para enviar el pedido.');
      return;
    }
    if (telefono.replace(/\D/g, '').length < 7) {
      setError('Escribe un teléfono de contacto válido.');
      return;
    }

    const { url } = apiWhatsApp.generarLinkPedido(
      { nombre: contacto.nombre, telefono: numero },
      { nombre: nombre.trim(), telefono: telefono.trim(), direccion: direccion.trim() },
      {
        items: carrito.map((item) => ({
          nombre: item.platillo.nombre,
          cantidad: item.cantidad,
          precio: item.platillo.precio,
        })),
        total,
      }
    );

    // Copia para el historial del comensal y la bandeja del restaurante.
    if (user && restauranteId) {
      void apiPedidos
        .crear({
          restauranteId,
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          direccion: direccion.trim(),
          items: carrito.map((item) => ({
            platillo_id: item.platillo.id,
            nombre: item.platillo.nombre,
            cantidad: item.cantidad,
            precio: item.platillo.precio,
          })),
          total,
        })
        .catch(() => undefined);
    }

    // Se recuerda el contacto para el próximo pedido; la dirección se guarda
    // estructurada desde el menú del restaurante, no aquí.
    try {
      localStorage.setItem(
        `tuki_user_basic_${user?.id ?? ''}`,
        JSON.stringify({ nombre: nombre.trim(), telefono: telefono.trim() })
      );
    } catch {
      // Sin almacenamiento el pedido sigue su curso.
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    vaciarCarrito();
    onCerrar();
  };

  const vacio = carrito.length === 0;

  return (
    <Hoja abierto={abierto} onCerrar={onCerrar} tituloId="titulo-carrito" ancho="lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="titulo-carrito" className="text-[20px] font-semibold tracking-tight text-af-ink">
            Tu pedido
          </h2>
          {!vacio && (
            <p className="mt-1 text-[13px] text-af-ink-secondary">
              Para {contacto?.nombre ?? restauranteNombre ?? 'el restaurante'}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar el carrito"
          className="af-pulsar -mr-1 rounded-full bg-af-surface p-2 text-af-ink-secondary transition-colors hover:text-af-ink"
        >
          <X size={18} />
        </button>
      </div>

      {vacio ? (
        <div className="flex flex-col items-center py-12 text-center">
          <span className="rounded-2xl bg-af-surface p-3 text-af-ink-secondary">
            <ShoppingBag size={22} aria-hidden="true" />
          </span>
          <p className="mt-3 text-[16px] font-semibold text-af-ink">Tu carrito está vacío</p>
          <p className="mt-1 max-w-[26ch] text-[14px] leading-relaxed text-af-ink-secondary">
            Agrega un plato con el botón + de la portada.
          </p>
          <button
            type="button"
            onClick={onCerrar}
            className="af-pulsar mt-5 rounded-full bg-af-ink px-5 py-2.5 text-[14px] font-semibold text-af-ground transition-opacity hover:opacity-90"
          >
            Ver platos
          </button>
        </div>
      ) : (
        <>
          <ul className="mt-4">
            {carrito.map((item) => (
              <li key={item.platillo.id} className="flex items-center gap-3 py-3">
                {item.platillo.imagen_url ? (
                  <img
                    src={item.platillo.imagen_url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-af-surface text-af-ink-secondary">
                    <ShoppingBag size={18} aria-hidden="true" />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-af-ink">
                    {item.platillo.nombre}
                  </p>
                  <p className="mt-0.5 text-[12px] tabular-nums text-af-ink-secondary">
                    {formatearPrecio(item.platillo.precio)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => actualizarCantidad(item.platillo.id, -1)}
                    aria-label={`Quitar uno de ${item.platillo.nombre}`}
                    disabled={item.cantidad <= 1}
                    className="af-pulsar flex h-7 w-7 items-center justify-center rounded-full bg-af-surface text-af-ink transition-opacity hover:opacity-70 disabled:opacity-40"
                  >
                    <Minus size={14} aria-hidden="true" />
                  </button>
                  <span className="w-4 text-center text-[13px] font-semibold tabular-nums text-af-ink">
                    {item.cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => actualizarCantidad(item.platillo.id, 1)}
                    aria-label={`Agregar uno de ${item.platillo.nombre}`}
                    className="af-pulsar flex h-7 w-7 items-center justify-center rounded-full bg-af-surface text-af-ink transition-opacity hover:opacity-70"
                  >
                    <Plus size={14} aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => eliminarItem(item.platillo.id)}
                  aria-label={`Quitar ${item.platillo.nombre} del carrito`}
                  className="af-pulsar shrink-0 rounded-full p-1.5 text-af-ink-secondary transition-colors hover:text-af-danger"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-2 flex items-baseline justify-between gap-3">
            <span className="text-[15px] font-semibold text-af-ink">Total</span>
            <span className="text-[19px] font-semibold tabular-nums text-af-ink">
              {formatearPrecio(total)}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-[13px] font-semibold text-af-ink-secondary">Datos de entrega</p>

            <label className="block">
              <span className="sr-only">Nombre</span>
              <input
                type="text"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                placeholder="Nombre"
                autoComplete="name"
                className="h-11 w-full rounded-xl bg-af-surface px-3.5 text-[15px] text-af-ink outline-none placeholder:text-af-ink-secondary focus:ring-2 focus:ring-af-accent/40"
              />
            </label>

            <label className="block">
              <span className="sr-only">Teléfono</span>
              <input
                type="tel"
                value={telefono}
                onChange={(evento) => setTelefono(evento.target.value)}
                placeholder="Teléfono"
                inputMode="tel"
                autoComplete="tel"
                className="h-11 w-full rounded-xl bg-af-surface px-3.5 text-[15px] text-af-ink outline-none placeholder:text-af-ink-secondary focus:ring-2 focus:ring-af-accent/40"
              />
            </label>

            <label className="block">
              <span className="sr-only">Dirección de entrega</span>
              <textarea
                value={direccion}
                onChange={(evento) => setDireccion(evento.target.value)}
                placeholder="Dirección de entrega"
                rows={2}
                autoComplete="street-address"
                className="w-full resize-none rounded-xl bg-af-surface px-3.5 py-3 text-[15px] leading-relaxed text-af-ink outline-none placeholder:text-af-ink-secondary focus:ring-2 focus:ring-af-accent/40"
              />
            </label>

            {user && (
              <p className="text-[12px] leading-relaxed text-af-ink-secondary">
                {tieneDatosGuardados
                  ? '¿Cambiaste de dirección?'
                  : '¿Quieres pedir más rápido la próxima vez?'}{' '}
                <Link
                  to="/mi-cuenta?seccion=envio"
                  onClick={onCerrar}
                  className="font-semibold text-af-accent-text transition-opacity hover:opacity-80"
                >
                  {tieneDatosGuardados
                    ? 'Actualiza tus datos de envío'
                    : 'Guarda tus datos de envío'}
                </Link>
              </p>
            )}

            {errorContacto && (
              <p role="alert" className="text-[13px] font-medium text-af-danger">
                {errorContacto}
              </p>
            )}
            {error && (
              <p role="alert" className="text-[13px] font-medium text-af-danger">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={pedir}
              disabled={cargandoContacto}
              className="af-pulsar w-full rounded-full bg-af-ink px-5 py-3.5 text-[15px] font-semibold text-af-ground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {cargandoContacto ? 'Cargando…' : 'Pedir por WhatsApp'}
            </button>
          </div>
        </>
      )}
    </Hoja>
  );
};
