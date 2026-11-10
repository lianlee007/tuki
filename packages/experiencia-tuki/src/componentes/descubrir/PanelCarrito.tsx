import React, { useEffect, useState } from 'react';
// @ts-ignore — react-router-dom no publica tipos en este proyecto.
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { apiPedidos, useStoreCarrito } from '../../modulos/pedidos';
import { apiDescubrir } from '../../api/apiDescubrir';
import { apiWhatsApp } from '../../api/misApis';
import { apiCuenta } from '../../modulos/cuenta';
import { formatearPrecio } from '../../lib/utils';
import { datosEnvioCompletos, formatearDireccionEnvio } from '../../modulos/cuenta';
import { Hoja } from './Hoja';
import { ETIQUETA, FOCO } from './estilos';

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

const CAMPO = `h-11 w-full rounded-xl bg-hearth-oat px-3.5 text-[16px] text-hearth-espresso outline-none transition-colors placeholder:text-hearth-pebble focus:bg-hearth-card focus:ring-2 focus:ring-hearth-terracotta/40 sm:text-[14px] dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:placeholder:text-hearth-night-pebble dark:focus:bg-hearth-night-card dark:focus:ring-hearth-night-terracotta/40`;

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

  /* Precarga lo que el comensal ya guardó en cualquier menú de TukiTuki. */
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
        <div className="min-w-0">
          <p className={`${ETIQUETA} text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink`}>
            Un pedido, un restaurante
          </p>
          <h2
            id="titulo-carrito"
            className="mt-1 font-jakarta text-xl font-extrabold tracking-[-0.02em] text-hearth-espresso dark:text-hearth-night-ink"
          >
            Tu pedido
          </h2>
          {!vacio && (
            <p className="mt-1 truncate text-[12.5px] text-hearth-pebble dark:text-hearth-night-pebble">
              Para {contacto?.nombre ?? restauranteNombre ?? 'el restaurante'}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar el carrito"
          className={`af-pulsar -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hearth-oat text-hearth-pebble transition-colors hover:text-hearth-espresso dark:bg-hearth-night-oat dark:text-hearth-night-pebble dark:hover:text-hearth-night-ink ${FOCO}`}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {vacio ? (
        <div className="flex flex-col items-center py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-hearth-oat text-hearth-terracotta-ink dark:bg-hearth-night-oat dark:text-hearth-night-terracotta-ink">
            <ShoppingBag size={22} aria-hidden="true" />
          </span>
          <p className="mt-3 text-[15px] font-extrabold text-hearth-espresso dark:text-hearth-night-ink">
            Tu canasta está lista para cocinar
          </p>
          <p className="mt-1 max-w-[28ch] text-[13px] leading-relaxed text-hearth-pebble dark:text-hearth-night-pebble">
            Agrega un plato con el botón + de la portada y llénala de sabor.
          </p>
          <button
            type="button"
            onClick={onCerrar}
            className={`af-pulsar mt-5 rounded-xl bg-hearth-terracotta-deep px-5 py-2.5 text-[13px] font-extrabold text-white shadow-warm transition-colors hover:bg-hearth-terracotta-ink dark:bg-hearth-night-terracotta dark:text-hearth-night dark:hover:bg-[#F6A184] ${FOCO}`}
          >
            Ver platos
          </button>
        </div>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-hearth-line/60 dark:divide-hearth-night-line">
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
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-hearth-oat text-hearth-pebble dark:bg-hearth-night-oat dark:text-hearth-night-pebble">
                    <ShoppingBag size={18} aria-hidden="true" />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-hearth-espresso dark:text-hearth-night-ink">
                    {item.platillo.nombre}
                  </p>
                  <p className="mt-0.5 text-[12px] tabular-nums text-hearth-pebble dark:text-hearth-night-pebble">
                    {formatearPrecio(item.platillo.precio)} c/u
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1 rounded-xl bg-hearth-oat p-0.5 ring-1 ring-hearth-line/70 dark:bg-hearth-night-oat dark:ring-hearth-night-line">
                  <button
                    type="button"
                    onClick={() => actualizarCantidad(item.platillo.id, -1)}
                    aria-label={`Quitar uno de ${item.platillo.nombre}`}
                    disabled={item.cantidad <= 1}
                    className={`af-pulsar flex h-7 w-7 items-center justify-center rounded-lg text-hearth-espresso transition-colors hover:bg-hearth-card disabled:opacity-40 dark:text-hearth-night-ink dark:hover:bg-hearth-night-card ${FOCO}`}
                  >
                    <Minus size={14} aria-hidden="true" />
                  </button>
                  <span className="w-4 text-center text-[12px] font-extrabold tabular-nums text-hearth-espresso dark:text-hearth-night-ink">
                    {item.cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => actualizarCantidad(item.platillo.id, 1)}
                    aria-label={`Agregar uno de ${item.platillo.nombre}`}
                    className={`af-pulsar flex h-7 w-7 items-center justify-center rounded-lg text-hearth-espresso transition-colors hover:bg-hearth-card dark:text-hearth-night-ink dark:hover:bg-hearth-night-card ${FOCO}`}
                  >
                    <Plus size={14} aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => eliminarItem(item.platillo.id)}
                  aria-label={`Quitar ${item.platillo.nombre} del carrito`}
                  className={`af-pulsar shrink-0 rounded-lg p-1.5 text-hearth-pebble transition-colors hover:text-[#A3231C] dark:text-hearth-night-pebble dark:hover:text-[#FF9B91] ${FOCO}`}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 rounded-2xl bg-hearth-oat/70 p-3.5 ring-1 ring-hearth-line/60 dark:bg-hearth-night-oat/70 dark:ring-hearth-night-line/60">
            <div className="flex items-center justify-between text-[12.5px] font-medium text-hearth-pebble dark:text-hearth-night-pebble">
              <span>Subtotal platos</span>
              <span className="font-bold tabular-nums text-hearth-espresso dark:text-hearth-night-ink">
                {formatearPrecio(total)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[12.5px] font-medium text-hearth-pebble dark:text-hearth-night-pebble">
              <span>Entrega</span>
              <span className="font-bold text-hearth-espresso dark:text-hearth-night-ink">
                Acordada con el local
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t border-hearth-line/70 pt-2 dark:border-hearth-night-line">
              <span className="text-[13px] font-extrabold text-hearth-espresso dark:text-hearth-night-ink">
                Total a pagar
              </span>
              <span className="font-jakarta text-lg font-extrabold tabular-nums text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink">
                {formatearPrecio(total)}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-hearth-honey-soft p-3 ring-1 ring-hearth-honey/25 dark:bg-hearth-night-honey-soft dark:ring-hearth-night-honey-ink/20">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hearth-card/70 text-hearth-honey-ink dark:bg-hearth-night-card/60 dark:text-hearth-night-honey-ink">
              <ShoppingBag size={18} aria-hidden="true" />
            </span>
            <p className="text-[11.5px] leading-snug text-hearth-honey-ink dark:text-hearth-night-honey-ink">
              <span className="block font-extrabold">Pedido por WhatsApp</span>
              El local confirma disponibilidad y forma de pago al recibir el mensaje.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <p className={`${ETIQUETA} text-[10px] text-hearth-pebble dark:text-hearth-night-pebble`}>
              Datos de entrega
            </p>

            <label className="block">
              <span className="sr-only">Nombre</span>
              <input
                type="text"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                placeholder="Nombre"
                autoComplete="name"
                className={CAMPO}
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
                className={CAMPO}
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
                className="w-full resize-none rounded-xl bg-hearth-oat px-3.5 py-3 text-[14px] leading-relaxed text-hearth-espresso outline-none transition-colors placeholder:text-hearth-pebble focus:bg-hearth-card focus:ring-2 focus:ring-hearth-terracotta/40 dark:bg-hearth-night-oat dark:text-hearth-night-ink dark:placeholder:text-hearth-night-pebble dark:focus:bg-hearth-night-card dark:focus:ring-hearth-night-terracotta/40"
              />
            </label>

            {user && (
              <p className="text-[11.5px] leading-relaxed text-hearth-pebble dark:text-hearth-night-pebble">
                {tieneDatosGuardados
                  ? '¿Cambiaste de dirección?'
                  : '¿Quieres pedir más rápido la próxima vez?'}{' '}
                <Link
                  to="/mi-cuenta?seccion=envio"
                  onClick={onCerrar}
                  className="font-bold text-hearth-terracotta-ink transition-opacity hover:opacity-80 dark:text-hearth-night-terracotta-ink"
                >
                  {tieneDatosGuardados
                    ? 'Actualiza tus datos de envío'
                    : 'Guarda tus datos de envío'}
                </Link>
              </p>
            )}

            {errorContacto && (
              <p role="alert" className="text-[12.5px] font-semibold text-[#A3231C] dark:text-[#FF9B91]">
                {errorContacto}
              </p>
            )}
            {error && (
              <p role="alert" className="text-[12.5px] font-semibold text-[#A3231C] dark:text-[#FF9B91]">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={pedir}
              disabled={cargandoContacto}
              className={`af-pulsar w-full rounded-xl bg-hearth-terracotta-deep px-5 py-3.5 text-[14px] font-extrabold text-white shadow-warm transition-colors hover:bg-hearth-terracotta-ink disabled:cursor-not-allowed disabled:opacity-60 dark:bg-hearth-night-terracotta dark:text-hearth-night dark:hover:bg-[#F6A184] ${FOCO}`}
            >
              {cargandoContacto ? 'Cargando…' : 'Pedir por WhatsApp'}
            </button>
          </div>
        </>
      )}
    </Hoja>
  );
};
