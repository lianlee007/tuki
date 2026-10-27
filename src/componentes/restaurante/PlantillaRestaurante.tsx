/**
 * Descripción: Vista pública del menú del restaurante.
 *
 * Criterio de diseño:
 * - Un solo ancho de contenido (7xl) para barra, portada, información, menú y
 *   pie: todo queda alineado al mismo margen. Antes cada bloque usaba un ancho
 *   distinto y las columnas no coincidían.
 * - La portada siempre lleva un velo oscuro, así que el texto blanco se lee
 *   aunque el color de marca sea claro. Los botones flotantes también son
 *   "cristal sobre oscuro" por el mismo motivo.
 * - El color de marca se usa para FONDO de botón; para texto, tintes y líneas
 *   se usan las variantes legibles de la capa semántica (accentText, etc.).
 * - La barra fija publica su altura real en --af-nav-h y las secciones usan
 *   .af-ancla, de manera que al saltar a una categoría el título nunca queda
 *   tapado por la barra.
 * - El modo claro/oscuro lo elige quien visita la página, y la paleta del
 *   restaurante se inyecta scopeada al contenedor (y a los modales).
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
// @ts-ignore — react-router-dom no publica tipos en este proyecto.
import { Link } from 'react-router-dom';
import { Restaurante, Tema, Platillo, EstiloPlantilla } from '../../tipos';
import {
  ShoppingCart,
  Facebook,
  Instagram,
  Phone,
  Clock,
  MapPin,
  Mail,
  Sparkles,
  Lock,
  ArrowDown,
  Share2,
  PenLine,
  Check,
  X,
  Star,
} from 'lucide-react';
import { ImagenInteligente, LogoWhatsApp, ThemeToggle, BotonTexto, Estrellas, Avatar } from '../ui';
import { useTema } from '../../contexto/ContextoTema';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { useStoreCarrito } from '../../store/storeCarrito';
import { ModalCarrito } from './ModalCarrito';
import { ModalDetallePlatillo } from './ModalDetallePlatillo';
import { ResenasPublicas } from './ResenasPublicas';
import { useResenas } from '../../hooks/useResenas';
import { apiSaludo, apiHorarios } from '../../api/misApis';
import { conLuminosidad, derivarPaleta, variablesAf, mezclar } from '../../lib/color';

// Estructuras del menú. Todas comparten `PlantillaMenuProps`, así que el menú
// se monta desde una tabla: ninguna puede quedarse sin `refs` (seguimiento de
// secciones) ni sin el estado de apertura del local.
import { EstiloModerno } from './plantillas/EstiloModerno';
import { EstiloCarta } from './plantillas/EstiloCarta';
import { EstiloMinimalista } from './plantillas/EstiloMinimalista';
import { EstiloGrid } from './plantillas/EstiloGrid';
import { EstiloInmersivo } from './plantillas/EstiloInmersivo';
import { EstiloVitrina } from './plantillas/EstiloVitrina';
import { EstiloMosaico } from './plantillas/EstiloMosaico';
import { EstiloDiptico } from './plantillas/EstiloDiptico';
import { EstiloCompacta } from './plantillas/EstiloCompacta';
import type { EstilosComunes, PlantillaMenuProps } from './plantillas/tipos';

// Se reexporta para no romper los imports existentes; la definición vive en el
// contrato de plantillas, que es el punto que ambos lados comparten.
export type { EstilosComunes } from './plantillas/tipos';

/** Ancho y margen únicos de toda la página pública. */
export const ANCHO_CONTENIDO = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

/** Estructuras disponibles. El valor guardado en el tema es la clave. */
const PLANTILLAS: Record<EstiloPlantilla, React.FC<PlantillaMenuProps>> = {
  moderno: EstiloModerno,
  carta: EstiloCarta,
  minimalista: EstiloMinimalista,
  grid: EstiloGrid,
  inmersivo: EstiloInmersivo,
  vitrina: EstiloVitrina,
  mosaico: EstiloMosaico,
  diptico: EstiloDiptico,
  compacta: EstiloCompacta,
};

const DIAS_LABEL = [
  { key: 'lunes', label: 'Lun', larga: 'Lunes' },
  { key: 'martes', label: 'Mar', larga: 'Martes' },
  { key: 'miercoles', label: 'Mié', larga: 'Miércoles' },
  { key: 'jueves', label: 'Jue', larga: 'Jueves' },
  { key: 'viernes', label: 'Vie', larga: 'Viernes' },
  { key: 'sabado', label: 'Sáb', larga: 'Sábado' },
  { key: 'domingo', label: 'Dom', larga: 'Domingo' },
] as const;

const ORDEN_DIAS = DIAS_LABEL.map((d) => d.key as string);

interface PlantillaProps {
  restaurante: Restaurante;
  tema: Tema;
  platillos: Platillo[];
  /** Plato que llega desde un enlace de Descubrir (`?plato=id`). */
  platilloInicialId?: string;
  modoPreview?: boolean;
  onClosePreview?: () => void;
}

const formatTime = (time?: string) => (time ? time.slice(0, 5) : '--:--');

/** Respeta a quien pidió menos movimiento en su sistema. */
const prefiereMenosMovimiento = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Resumen legible de los días de apertura, agrupando rangos consecutivos. */
const resumenDias = (dias?: Record<string, boolean>): string => {
  if (!dias) return '';
  const abiertos = ORDEN_DIAS.filter((k) => dias[k]);
  if (abiertos.length === 0) return 'Sin días configurados';
  if (abiertos.length === 7) return 'Abierto todos los días';
  const rangos: string[] = [];
  let inicio = 0;
  for (let i = 1; i <= abiertos.length; i++) {
    const consecutivo = i < abiertos.length && ORDEN_DIAS.indexOf(abiertos[i]) === ORDEN_DIAS.indexOf(abiertos[i - 1]) + 1;
    if (!consecutivo) {
      const a = DIAS_LABEL.find((d) => d.key === abiertos[inicio])!;
      const b = DIAS_LABEL.find((d) => d.key === abiertos[i - 1])!;
      rangos.push(inicio === i - 1 ? a.label : `${a.label}–${b.label}`);
      inicio = i;
    }
  }
  return rangos.join(' · ');
};

interface InfoItemProps {
  icono: React.ReactNode;
  titulo: string;
  valor: string;
  sub?: string;
  /** Color legible del icono (capa semántica, nunca el color de marca crudo). */
  acento: string;
  extra?: React.ReactNode;
}

const InfoItem: React.FC<InfoItemProps> = ({ icono, titulo, valor, sub, acento, extra }) => (
  <div className="flex items-start gap-3.5 px-5 py-5 sm:px-6 sm:py-6 min-w-0">
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${acento}1F`, color: acento }}
    >
      {icono}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-af-ink-secondary mb-1">{titulo}</p>
      <p className="text-sm sm:text-[15px] font-semibold text-af-ink leading-snug break-words">{valor}</p>
      {sub ? <p className="text-xs text-af-ink-secondary mt-0.5 break-words">{sub}</p> : null}
      {extra}
    </div>
  </div>
);

export const PlantillaRestaurante: React.FC<PlantillaProps> = ({
  restaurante,
  tema,
  platillos,
  platilloInicialId,
  modoPreview,
  onClosePreview,
}) => {
  const { tema: temaGlobal } = useTema();
  const { user } = useAuth();
  const { carrito, modalAbierto, setModalAbierto, agregarItem, eliminarItem, actualizarCantidad, vaciarCarrito } = useStoreCarrito();
  const [categoriaActiva, setCategoriaActiva] = useState<string>('');
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const [platilloSeleccionado, setPlatilloSeleccionado] = useState<Platillo | null>(null);
  const [saludoDinamico, setSaludoDinamico] = useState<string>('');
  const [estadoLocal, setEstadoLocal] = useState<{ abierto: boolean; mensaje: string }>({ abierto: true, mensaje: '' });
  const [resenaAbierta, setResenaAbierta] = useState(false);
  const [platilloResena, setPlatilloResena] = useState<string | null>(null);
  const [compartido, setCompartido] = useState(false);
  const [avisoPedido, setAvisoPedido] = useState(false);

  const {
    publicas: resenasPublicas,
    resumen: resumenResenas,
    cargando: cargandoResenas,
    error: errorResenas,
    recargar: recargarResenas,
  } = useResenas(restaurante.id);

  const navRef = useRef<HTMLElement | null>(null);
  const [altoNav, setAltoNav] = useState(108);
  const bloqueoScrollSpy = useRef(0);

  const isDark = temaGlobal === 'dark';

  /**
   * Quien llega desde Descubrir ya eligió el plato: se abre su detalle sin
   * obligarle a buscarlo otra vez en la carta. Solo una vez por id, para que
   * cerrar el modal no lo reabra en el siguiente render.
   */
  const platoAbierto = useRef<string | null>(null);
  useEffect(() => {
    if (!platilloInicialId || platoAbierto.current === platilloInicialId) return;
    const plato = platillos.find((item) => item.id === platilloInicialId);
    if (!plato) return;
    platoAbierto.current = platilloInicialId;
    setPlatilloSeleccionado(plato);
  }, [platilloInicialId, platillos]);

  useEffect(() => {
    const fetchSaludo = async () => {
      try {
        const data = await apiSaludo.obtenerMensajeBienvenida(restaurante.nombre);
        setSaludoDinamico(data.mensaje);
      } catch {
        // silencioso: no bloquea la vista
      }
    };
    fetchSaludo();
  }, [restaurante.nombre]);

  useEffect(() => {
    const checkHorario = async () => {
      if (restaurante.horario_apertura && restaurante.horario_cierre) {
        try {
          const status = await apiHorarios.validarDisponibilidad(restaurante.horario_apertura, restaurante.horario_cierre);
          setEstadoLocal({ abierto: status.abierto, mensaje: status.mensaje });
        } catch {
          setEstadoLocal({ abierto: true, mensaje: 'Horario disponible' });
        }
      }
    };
    checkHorario();
    const interval = setInterval(checkHorario, 60000);
    return () => clearInterval(interval);
  }, [restaurante.horario_apertura, restaurante.horario_cierre]);

  // Mide la barra fija real (cambia de alto al pasar de móvil a escritorio y
  // según haya o no fila de categorías) y la publica como --af-nav-h.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const medir = () => setAltoNav(el.getBoundingClientRect().height || 108);
    medir();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', medir);
      return () => window.removeEventListener('resize', medir);
    }
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [platillos.length]);

  // Paleta activa: el visitante decide el modo claro/oscuro desde la propia página.
  const base = isDark
    ? {
        bg: tema.color_fondo_oscuro || conLuminosidad(tema.color_fondo, 0.055),
        text: tema.color_texto_oscuro || '#F5F5F4',
        title: tema.color_texto_titulos_oscuro || '#FFFFFF',
        primary: tema.color_primario_oscuro || conLuminosidad(tema.color_primario, 0.68),
        secondary: tema.color_secundario_oscuro || conLuminosidad(tema.color_secundario, 0.62),
      }
    : {
        bg: tema.color_fondo,
        text: tema.color_texto,
        title: tema.color_texto_titulos || tema.color_texto,
        primary: tema.color_primario,
        secondary: tema.color_secundario,
      };

  // Superficies, bordes, texto secundario y precios se derivan del fondo y el
  // texto, corrigiendo el contraste cuando es insuficiente (temas heredados).
  const paleta = derivarPaleta(base);
  const c = {
    fondo: paleta.bg,
    texto: paleta.text,
    textoTitulos: paleta.title,
    primario: paleta.primary,
    secundario: paleta.secondary,
  };

  const estilos: EstilosComunes = {
    ...paleta,
    cardBorder: `1px solid ${paleta.border}`,
    cardHoverShadow: paleta.bgEsOscuro ? '0 24px 48px -16px rgba(0,0,0,0.55)' : '0 24px 48px -16px rgba(0,0,0,0.12)',
    isDark,
  };

  // Variables scopeadas: toda la interfaz (clases af-*) hereda la paleta del restaurante.
  const variables = variablesAf(base);

  const menuPorCategoria = platillos.reduce((acc, p) => {
    const cat = p.categoria || 'Especialidades';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, Platillo[]>);
  const categorias = Object.keys(menuPorCategoria);
  const claveCategorias = categorias.join('|');

  /** Un solo buscador: unas plantillas registran refs y otras ponen id. */
  const nodoCategoria = (cat: string): HTMLElement | null =>
    categoryRefs.current[cat] ?? document.getElementById(`cat-${cat}`);

  const scrollToCategory = (cat: string) => {
    setCategoriaActiva(cat);
    bloqueoScrollSpy.current = Date.now() + 800;
    nodoCategoria(cat)?.scrollIntoView({ behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth', block: 'start' });
  };

  const scrollAlMenu = () => {
    document.getElementById('menu-inicio')?.scrollIntoView({
      behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  /** Las reseñas son la segunda parada de la ficha, después de la carta. */
  const irAResenas = () => {
    document.getElementById('resenas')?.scrollIntoView({
      behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  // Resalta la píldora de la categoría que se está leyendo. Se desactiva un
  // instante tras pulsar una píldora para que el salto suave no la haga parpadear.
  useEffect(() => {
    if (categorias.length === 0) return;
    let pendiente = 0;
    const actualizar = () => {
      pendiente = 0;
      if (Date.now() < bloqueoScrollSpy.current) return;
      const limite = altoNav + 40;
      let actual = categorias[0];
      for (const cat of categorias) {
        const nodo = nodoCategoria(cat);
        if (nodo && nodo.getBoundingClientRect().top <= limite) actual = cat;
      }
      setCategoriaActiva((prev) => (prev === actual ? prev : actual));
    };
    const alDesplazar = () => {
      if (pendiente) return;
      pendiente = window.requestAnimationFrame(actualizar);
    };
    actualizar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => {
      window.removeEventListener('scroll', alDesplazar);
      if (pendiente) window.cancelAnimationFrame(pendiente);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveCategorias, altoNav]);

  const handleVerPlatillo = (p: Platillo) => setPlatilloSeleccionado(p);
  const handleAgregarAlCarrito = useCallback((p: Platillo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!estadoLocal.abierto) return;
    agregarItem(p);
  }, [estadoLocal.abierto, agregarItem]);

  /**
   * Abre el formulario de reseña. Si viene de un plato concreto (el que se
   * acaba de pedir), lo deja seleccionado. El desplazamiento espera un frame
   * para que la sección ya esté montada cuando se pide su posición.
   */
  const abrirResena = (platilloId?: string | null) => {
    setPlatilloResena(platilloId ?? null);
    setResenaAbierta(true);
    window.setTimeout(() => {
      document.getElementById('resenas')?.scrollIntoView({
        behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 60);
  };

  /**
   * Compartir la ficha. En móvil usa la hoja nativa; en escritorio copia el
   * enlace. Nunca se comparte el carrito ni datos del comensal.
   */
  const compartir = async () => {
    const url = window.location.href;
    const datos = {
      title: restaurante.nombre,
      text: `Mira el menú de ${restaurante.nombre} en Tuki`,
      url,
    };

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(datos);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCompartido(true);
        window.setTimeout(() => setCompartido(false), 2200);
      } else {
        window.prompt('Copia el enlace del restaurante', url);
      }
    } catch {
      // El usuario canceló la hoja nativa o el navegador negó el portapapeles.
    }
  };

  const tieneBanner = Boolean(restaurante.imagen_banner_url);
  const enlaceWhatsApp = restaurante.whatsapp
    ? `https://wa.me/57${restaurante.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('¡Hola! Estoy interesado en realizar un pedido. ¿Me pueden ayudar?')}`
    : '';
  const diasAbiertos = restaurante.dias_abierto ? ORDEN_DIAS.filter((k) => restaurante.dias_abierto[k]) : [];
  const totalUnidades = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  // Un tema guardado con una estructura que ya no existe cae en Tarjetas.
  const Estructura = PLANTILLAS[tema.estilo_plantilla] ?? EstiloModerno;

  // Velo garantizado. Sin él, con un color de marca claro (amarillo, dorado,
  // turquesa) el texto blanco de la portada se pierde. Con él, el peor caso
  // (la parada más clara del degradado justo debajo del texto) supera 4.5:1.
  const velo = 'linear-gradient(180deg, rgba(0,0,0,0.36) 0%, rgba(0,0,0,0.44) 45%, rgba(0,0,0,0.82) 100%)';
  // Portada con foto: el velo debe aguantar que la foto sea blanca justo donde
  // va el texto, por eso va más cargado que el de la portada con color plano.
  const veloFoto = 'linear-gradient(180deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.58) 50%, rgba(0,0,0,0.88) 100%)';

  return (
    <div
      style={{
        ...(variables as React.CSSProperties),
        '--af-nav-h': `${altoNav}px`,
        backgroundColor: c.fondo,
        color: c.texto,
        minHeight: '100vh',
        overflowX: 'clip',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      } as React.CSSProperties}
      className="relative"
    >
      <style>{`
        .font-title { font-family: '${tema.fuente_titulos}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .card-af-resto {
          background: ${estilos.cardBg};
          border: ${estilos.cardBorder};
          border-radius: 20px;
          transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.2s ease-out, border-color 0.2s ease-out;
        }
        @media (hover: hover) and (pointer: fine) {
          .card-af-resto:hover {
            box-shadow: ${estilos.cardHoverShadow};
            transform: translateY(-3px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .card-af-resto { transition: none; }
          .card-af-resto:hover { transform: none; }
        }
      `}</style>

      {/* BARRA SUPERIOR */}
      <nav ref={navRef} className="nav-af sticky top-0 z-50">
        <div className={ANCHO_CONTENIDO}>
          <div className="flex justify-between items-center h-16 sm:h-[72px]">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth' })}
              className="flex items-center gap-3 min-w-0 text-left"
            >
              {restaurante.imagen_logo_url ? (
                <span className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-af/30 block">
                  <ImagenInteligente src={restaurante.imagen_logo_url} alt="" className="w-full h-full" />
                </span>
              ) : (
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 font-title"
                  style={{ backgroundColor: c.primario, color: estilos.onPrimary }}
                >
                  {restaurante.nombre.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="text-base sm:text-lg font-bold text-af-ink tracking-[-0.01em] font-title truncate max-w-[42vw] sm:max-w-[280px]">
                {restaurante.nombre}
              </span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {user && !modoPreview && (
                <Link
                  to="/mi-cuenta"
                  title="Mi cuenta"
                  aria-label="Mi cuenta"
                  className="hidden h-10 w-10 items-center justify-center rounded-full af-pulsar sm:flex"
                >
                  <Avatar
                    nombre={
                      [user.user_metadata?.nombre, user.user_metadata?.apellido]
                        .filter(Boolean)
                        .join(' ')
                        .trim() || user.email || 'Cuenta'
                    }
                    tamano={32}
                  />
                </Link>
              )}
              <ThemeToggle conFondo />
              <button
                type="button"
                onClick={() => setModalAbierto(true)}
                aria-label="Abrir el pedido"
                className="relative w-10 h-10 rounded-full bg-af-surface border border-af/30 text-af-ink flex items-center justify-center af-pulsar"
              >
                <ShoppingCart size={19} />
                {totalUnidades > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums"
                    style={{ backgroundColor: c.primario, color: estilos.onPrimary }}
                  >
                    {totalUnidades}
                  </span>
                )}
              </button>
              {modoPreview && onClosePreview && (
                <BotonTexto onClick={onClosePreview} className="text-af-danger">Salir</BotonTexto>
              )}
            </div>
          </div>
        </div>

        {/* La barra de la ficha no es solo el índice de la carta: debajo de
            las categorías vive el acceso a las reseñas, que es la otra parada
            de la página. Sin categorías se muestra igual, para que una ficha
            recién creada no esconda sus opiniones. */}
        <div className="border-t border-af/20">
          <div className={ANCHO_CONTENIDO}>
            <div className="af-sin-scrollbar flex items-center gap-2 overflow-x-auto py-2.5">
              {categorias.map((cat) => {
                const activa = categoriaActiva === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => scrollToCategory(cat)}
                    aria-current={activa ? 'true' : undefined}
                    className="px-3.5 py-2 text-[13px] font-semibold rounded-full whitespace-nowrap af-pulsar"
                    style={activa
                      ? { backgroundColor: c.primario, color: estilos.onPrimary }
                      : { backgroundColor: paleta.surface, color: paleta.muted }}
                  >
                    {cat}
                  </button>
                );
              })}

              {categorias.length > 0 && (
                <span className="h-5 w-px shrink-0 bg-af/25" aria-hidden="true" />
              )}

              <button
                type="button"
                onClick={irAResenas}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap af-pulsar"
                style={{ backgroundColor: paleta.surface, color: paleta.muted }}
              >
                <Star size={14} />
                Reseñas
                {resumenResenas.cantidad > 0 && (
                  <span className="tabular-nums opacity-70">
                    ({resumenResenas.cantidad})
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* PORTADA */}
      <header className="mt-3 sm:mt-5">
        <div className={ANCHO_CONTENIDO}>
          <div className="relative rounded-[20px] sm:rounded-[28px] overflow-hidden">
            <div className="absolute inset-0">
              {tieneBanner ? (
                <>
                  <ImagenInteligente src={restaurante.imagen_banner_url} alt="" className="w-full h-full" />
                  {/* Una foto puede ser blanca en cualquier punto, así que aquí el
                      velo es más denso: garantiza el blanco legible sobre cualquier
                      imagen, no solo sobre las oscuras. */}
                  <div className="absolute inset-0" style={{ background: veloFoto }} />
                </>
              ) : (
                <>
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(145deg, ${mezclar(c.primario, '#000000', 0.16)} 0%, ${mezclar(c.primario, '#000000', 0.68)} 100%)`,
                    }}
                  />
                  <div className="absolute inset-0" style={{ background: velo }} />
                </>
              )}
            </div>

            <div className="relative z-10 flex flex-col justify-end min-h-[340px] sm:min-h-[420px] lg:min-h-[480px] px-6 sm:px-10 lg:px-14 pt-14 pb-24 sm:pb-32">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  {restaurante.imagen_logo_url && (
                    <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-white/25 shrink-0 block">
                      <ImagenInteligente src={restaurante.imagen_logo_url} alt="" className="w-full h-full" />
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold text-white bg-black/30 backdrop-blur-md border border-white/20 max-w-full">
                    {estadoLocal.abierto ? <Clock size={13} className="shrink-0" /> : <Lock size={13} className="shrink-0" />}
                    <span className="truncate">{estadoLocal.mensaje || (estadoLocal.abierto ? 'Abierto ahora' : 'Cerrado')}</span>
                  </span>
                </div>

                <h1
                  className="text-[2.1rem] sm:text-5xl lg:text-[3.4rem] font-bold text-white font-title tracking-[-0.025em] leading-[1.05] mb-3"
                  style={{ textWrap: 'balance' }}
                >
                  {restaurante.nombre}
                </h1>

                {restaurante.eslogan && (
                  <p className="text-white text-base sm:text-lg font-medium max-w-2xl leading-relaxed" style={{ textWrap: 'pretty' }}>
                    {restaurante.eslogan}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-7">
                  {categorias.length > 0 && (
                    <button
                      type="button"
                      onClick={scrollAlMenu}
                      className="px-5 sm:px-6 py-3 rounded-full font-bold text-sm sm:text-base inline-flex items-center gap-2 af-pulsar"
                      style={{ backgroundColor: c.primario, color: estilos.onPrimary }}
                    >
                      Ver el menú <ArrowDown size={16} />
                    </button>
                  )}
                  {enlaceWhatsApp && (
                    <a
                      href={enlaceWhatsApp}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 sm:px-6 py-3 rounded-full font-bold text-sm sm:text-base inline-flex items-center gap-2 bg-white text-[#111111] hover:bg-white/90 af-pulsar"
                    >
                      <LogoWhatsApp className="w-4 h-4" /> Pedir por WhatsApp
                    </a>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  {cargandoResenas ? (
                    <span className="h-8 w-32 animate-pulse rounded-full bg-white/20" />
                  ) : errorResenas ? (
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md">
                      Reseñas no disponibles
                    </span>
                  ) : resumenResenas.cantidad > 0 ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-white backdrop-blur-md">
                      <Estrellas
                        valor={resumenResenas.promedio}
                        tamano={14}
                        className="text-white"
                      />
                      <span className="text-sm font-semibold tabular-nums">
                        {resumenResenas.promedio.toFixed(1)}
                      </span>
                      <span className="text-xs text-white/75">
                        ({resumenResenas.cantidad})
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md">
                      Sé el primero en reseñar
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => abrirResena()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20 af-pulsar"
                  >
                    <PenLine size={14} />
                    Escribir reseña
                  </button>

                  <button
                    type="button"
                    onClick={compartir}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20 af-pulsar"
                  >
                    <Share2 size={14} />
                    {compartido ? 'Enlace copiado' : 'Compartir'}
                  </button>
                </div>

                {saludoDinamico && (
                  <p className="mt-6 inline-flex items-start gap-2 text-white/95 text-xs sm:text-sm bg-black/30 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2.5 max-w-xl">
                    <Sparkles size={13} className="text-amber-300 shrink-0 mt-0.5" /> {saludoDinamico}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* INFORMACIÓN */}
      <section className="relative z-20 -mt-12 sm:-mt-16">
        <div className={ANCHO_CONTENIDO}>
          <div
            className="rounded-[20px] sm:rounded-[24px] border border-af/25 overflow-hidden grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-af/20"
            style={{ backgroundColor: paleta.surface }}
          >
            <InfoItem
              icono={<MapPin size={18} />}
              titulo="Ubicación"
              valor={restaurante.direccion || 'Por confirmar'}
              sub={[restaurante.ciudad, restaurante.pais].filter(Boolean).join(', ')}
              acento={estilos.accentText}
            />
            <InfoItem
              icono={<Clock size={18} />}
              titulo="Horario"
              valor={`${formatTime(restaurante.horario_apertura)} – ${formatTime(restaurante.horario_cierre)}`}
              acento={estilos.secondaryText}
              extra={diasAbiertos.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {DIAS_LABEL.map((d) => {
                    const activo = Boolean(restaurante.dias_abierto?.[d.key]);
                    return (
                      <span
                        key={d.key}
                        title={d.larga}
                        className="w-7 h-7 rounded-lg text-[11px] font-bold flex items-center justify-center"
                        style={activo
                          ? { backgroundColor: c.primario, color: estilos.onPrimary }
                          : { backgroundColor: paleta.surface, color: paleta.muted, border: `1px solid ${paleta.border}` }}
                      >
                        {d.label}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-af-ink-secondary mt-1">{resumenDias(restaurante.dias_abierto)}</p>
              )}
            />
            <InfoItem
              icono={<Phone size={18} />}
              titulo="Contacto"
              valor={restaurante.telefono || 'Por confirmar'}
              sub={restaurante.email || undefined}
              acento={estilos.accentText}
            />
          </div>
        </div>
      </section>

      {/* MENÚ */}
      <main id="menu-inicio" className="af-ancla relative z-10 min-h-[40vh] pt-12 sm:pt-16">
        {categorias.length === 0 ? (
          <div className="max-w-xl mx-auto text-center px-6 py-20">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-af-surface border border-af/20 text-af-ink-secondary">
              <Clock size={24} />
            </div>
            <h2 className="text-xl font-bold text-af-ink font-title mb-2">El menú estará disponible pronto</h2>
            <p className="text-af-ink-secondary">Este restaurante aún no ha publicado sus platillos.</p>
          </div>
        ) : (
          <Estructura
            categorias={categorias}
            menuPorCategoria={menuPorCategoria}
            estilos={estilos}
            refs={categoryRefs}
            onVerPlatillo={handleVerPlatillo}
            onAgregarAlCarrito={handleAgregarAlCarrito}
            localAbierto={estadoLocal.abierto}
          />
        )}
      </main>

      <ResenasPublicas
        restauranteId={restaurante.id}
        platillos={platillos}
        resenas={resenasPublicas}
        resumen={resumenResenas}
        cargando={cargandoResenas}
        error={errorResenas}
        onRecargar={recargarResenas}
        formularioAbierto={resenaAbierta}
        onAbrirFormulario={() => abrirResena()}
        onCerrarFormulario={() => setResenaAbierta(false)}
        platilloInicialId={platilloResena}
        estilos={estilos}
      />

      {/* PIE */}
      <footer className="border-t border-af/20 mt-16 sm:mt-24 relative z-10">
        <div className={ANCHO_CONTENIDO}>
          <div className="py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-4">
                {restaurante.imagen_logo_url ? (
                  <span className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-af/25 block">
                    <ImagenInteligente src={restaurante.imagen_logo_url} alt="" className="w-full h-full" />
                  </span>
                ) : (
                  <span
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 font-title"
                    style={{ backgroundColor: c.primario, color: estilos.onPrimary }}
                  >
                    {restaurante.nombre.charAt(0).toUpperCase()}
                  </span>
                )}
                <h3 className="text-2xl sm:text-3xl font-bold text-af-ink font-title break-words">{restaurante.nombre}</h3>
              </div>
              <p className="text-af-ink-secondary leading-relaxed max-w-xl">
                {restaurante.descripcion || 'Descubre sabores únicos elaborados con pasión y dedicación.'}
              </p>

              <div className="flex gap-3 mt-6">
                {restaurante.facebook && (
                  <a href={restaurante.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="w-10 h-10 rounded-full flex items-center justify-center bg-af-ground border border-af/25 text-af-ink hover:border-af-accent-text hover:text-af-accent-text af-pulsar">
                    <Facebook size={18} />
                  </a>
                )}
                {restaurante.instagram && (
                  <a href={restaurante.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-full flex items-center justify-center bg-af-ground border border-af/25 text-af-ink hover:border-af-accent-text hover:text-af-accent-text af-pulsar">
                    <Instagram size={18} />
                  </a>
                )}
                {enlaceWhatsApp && (
                  <a href={enlaceWhatsApp} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="w-10 h-10 rounded-full flex items-center justify-center bg-af-ground border border-af/25 text-af-ink hover:border-af-accent-text hover:text-af-accent-text af-pulsar">
                    <LogoWhatsApp className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            <div className="min-w-0 space-y-2.5">
              {restaurante.direccion && (
                <p className="flex items-start gap-2.5 text-sm text-af-ink-secondary">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  <span className="break-words">{restaurante.direccion}{restaurante.ciudad ? `, ${restaurante.ciudad}` : ''}</span>
                </p>
              )}
              {restaurante.telefono && (
                <p className="flex items-start gap-2.5 text-sm text-af-ink-secondary">
                  <Phone size={16} className="mt-0.5 shrink-0" />
                  <span className="break-all">{restaurante.telefono}</span>
                </p>
              )}
              {restaurante.email && (
                <p className="flex items-start gap-2.5 text-sm text-af-ink-secondary">
                  <Mail size={16} className="mt-0.5 shrink-0" />
                  <span className="break-all">{restaurante.email}</span>
                </p>
              )}
              {(restaurante.horario_apertura || restaurante.horario_cierre) && (
                <p className="flex items-start gap-2.5 text-sm text-af-ink-secondary">
                  <Clock size={16} className="mt-0.5 shrink-0" />
                  <span>{formatTime(restaurante.horario_apertura)} – {formatTime(restaurante.horario_cierre)} · {resumenDias(restaurante.dias_abierto)}</span>
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-af/20 py-6 text-center text-xs text-af-ink-secondary">
            © {new Date().getFullYear()} {restaurante.nombre}. Creado con Tuki.
          </div>
        </div>
      </footer>

      {/* MODALES (portal) */}
      {platilloSeleccionado && (
        <ModalDetallePlatillo
          platillo={platilloSeleccionado}
          onClose={() => setPlatilloSeleccionado(null)}
          onAddToCart={(p, cantidad) => {
            if (!estadoLocal.abierto) return;
            for (let i = 0; i < cantidad; i++) agregarItem(p);
          }}
          estilos={estilos}
          isDark={isDark}
          localAbierto={estadoLocal.abierto}
        />
      )}

      {modalAbierto && (
        <ModalCarrito
          carrito={carrito}
          onClose={() => setModalAbierto(false)}
          onRemove={eliminarItem}
          onUpdate={actualizarCantidad}
          restaurante={{ nombre: restaurante.nombre, whatsapp: restaurante.whatsapp }}
          restauranteId={restaurante.id}
          estilos={estilos}
          isDark={isDark}
          vaciarCarrito={vaciarCarrito}
          localAbierto={estadoLocal.abierto}
          onPedidoEnviado={(platilloId) => {
            setPlatilloResena(platilloId ?? null);
            setAvisoPedido(true);
          }}
        />
      )}

      {avisoPedido && !modoPreview && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 z-[80] w-[min(92vw,460px)] -translate-x-1/2 rounded-[22px] border border-af/20 bg-af-surface p-4 shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-af-success/15 text-af-success">
              <Check size={20} strokeWidth={2.6} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-af-ink">Pedido enviado</p>
              <p className="mt-0.5 text-xs leading-relaxed text-af-ink-secondary">
                ¿Nos cuentas cómo estuvo? Tu reseña ayuda a quien viene detrás.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAvisoPedido(false)}
              aria-label="Cerrar aviso"
              className="rounded-full p-1 text-af-ink-secondary transition-colors hover:text-af-ink af-pulsar"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setAvisoPedido(false);
                abrirResena(platilloResena);
              }}
              className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-white af-pulsar"
              style={{ backgroundColor: estilos.primary, color: estilos.onPrimary }}
            >
              Escribir reseña
            </button>
            <button
              type="button"
              onClick={() => setAvisoPedido(false)}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-af-ink-secondary transition-colors hover:text-af-ink af-pulsar"
            >
              Ahora no
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
