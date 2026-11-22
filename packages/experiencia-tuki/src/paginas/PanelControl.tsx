/**
 * Descripción: Panel principal donde el usuario gestiona su restaurante, menú y diseño.
 * Reforma Apple: tipografía sistema, planos, sin neumorfismo, blur en barras flotantes.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexto/ContextoAutenticacion';
import { useTema } from '../contexto/ContextoTema';
import { subirImagen, generarContenidoIA } from '../lib/servicios';
import { acentoPanel, acentoRecordado, recordarAcento } from '../lib/color';
import { Restaurante, Tema, Platillo } from '../tipos';
import { Menu, ArrowLeft, Trash2, AlertTriangle, Check, LogOut, Eye, X } from 'lucide-react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { PlantillaRestaurante } from '../componentes/restaurante/PlantillaRestaurante';
import { BarraLateral } from '../componentes/panel/BarraLateral';
import { SeccionDifusion } from '../componentes/panel/SeccionDifusion';
import { SeccionInfo, type EstadoPublicacion } from '../componentes/panel/SeccionInfo';
import { BarraPendientes } from '../componentes/panel/BarraPendientes';
import { SeccionDiseno } from '../componentes/panel/SeccionDiseno';
import { SeccionMenu } from '../componentes/panel/SeccionMenu';
import { SeccionResenas } from '../componentes/panel/SeccionResenas';
import { SeccionPedidos } from '../componentes/panel/SeccionPedidos';
import { EditorPlatillo } from '../componentes/panel/EditorPlatillo';
import {
  apiPlatillos,
  apiRestaurante,
  camposDeEstado,
  useDatosPanel,
  type EstadoPlatillo,
} from '../modulos/menu';

export const formatError = (e: any): string => {
  if (!e) return "Error desconocido";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  if (typeof e === "object") {
    return e.message || e.error_description || e.details || JSON.stringify(e);
  }
  return String(e);
};

/** Título y descripción de cada apartado: una sola fuente para la cabecera. */
const SECCIONES: Record<
  'info' | 'tema' | 'menu' | 'difusion' | 'resenas' | 'pedidos',
  { eyebrow: string; titulo: string; descripcion: string }
> = {
  info: {
    eyebrow: 'Tu negocio',
    titulo: 'Información del restaurante',
    descripcion: 'Identidad, contacto y horarios. Es lo que ve el comensal cuando entra a tu menú.',
  },
  menu: {
    eyebrow: 'Carta',
    titulo: 'Menú',
    descripcion: 'Platillos, categorías y disponibilidad. Lo que está apagado no se muestra.',
  },
  pedidos: {
    eyebrow: 'Operación',
    titulo: 'Pedidos',
    descripcion: 'Lo que ha llegado hoy y lo que todavía falta por atender.',
  },
  resenas: {
    eyebrow: 'Comunidad',
    titulo: 'Reseñas',
    descripcion: 'Lo que dicen quienes ya comieron, con su respuesta en un toque.',
  },
  tema: {
    eyebrow: 'Identidad visual',
    titulo: 'Apariencia',
    descripcion: 'Colores, tipografía y plantilla. Tu menú, con tu carácter.',
  },
  difusion: {
    eyebrow: 'Alcance',
    titulo: 'Difusión',
    descripcion: 'Tu enlace público, el QR para las mesas y lo que compartes por WhatsApp.',
  },
};

export default function PanelControl() {
  const { user, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const { tema: modoTema } = useTema();
  const { cargando, restaurante, setRestaurante, tema, setTema, categorias, platillos, setPlatillos, mensaje, mostrarMensaje, cerrarMensaje, cargarDatos } = useDatosPanel(user);

  /**
   * El panel se pinta con el color de marca que el dueño eligió en Diseño: la
   * barra lateral, los botones, la pestaña activa y los focos llevan SU color,
   * no el acento de serie. El papel y la tinta no se tocan (la legibilidad del
   * panel no depende del gusto de nadie) y el acento se recalcula contra las
   * superficies reales del panel en cada modo, así que cualquier color de marca
   * sigue cumpliendo AA en claro y en oscuro.
   *
   * Es un `style` en la raíz —no una clase global— porque la vista previa monta
   * la plantilla justo debajo y ésta ya reescribe los mismos canales para sí
   * misma: así el panel se tiñe y la vista previa no.
   *
   * Mientras el tema viaja por la red se usa el acento que este mismo usuario vio
   * la última vez (ver `recordarAcento`). El panel aparece en cuanto llega el
   * restaurante, que es la primera petición: si el color tuviera que esperar a la
   * segunda, el dueño vería el panel entero con el acento de serie y un salto
   * después. Un color elegido a conciencia no debería anunciarse con un fogonazo.
   */
  const marcaClara = tema?.color_primario;
  const marcaOscura = tema?.color_primario_oscuro || tema?.color_primario;

  const estiloMarca = useMemo(() => {
    // El contexto de tema nombra el modo en inglés; `acentoPanel` acepta las dos
    // grafías, pero aquí se traduce una sola vez para no depender de ello.
    const oscuro = modoTema === 'dark';
    const modo = oscuro ? ('oscuro' as const) : ('claro' as const);
    const marca = oscuro ? marcaOscura : marcaClara;
    const acento = marca ? acentoPanel(marca, modo) : acentoRecordado(user?.id, modo);
    return acento as React.CSSProperties | undefined;
  }, [modoTema, marcaClara, marcaOscura, user?.id]);

  // El acento que acaba de llegar se recuerda para el arranque siguiente. Se
  // anota al conocerlo y no al guardarlo, para que también quede apuntado el que
  // viene del servidor en una sesión cualquiera, que es el caso normal.
  useEffect(() => {
    if (user?.id && marcaClara && marcaOscura) {
      recordarAcento(user.id, { claro: marcaClara, oscuro: marcaOscura });
    }
  }, [user?.id, marcaClara, marcaOscura]);

  const [tabActiva, setTabActiva] = useState<'info' | 'tema' | 'menu' | 'difusion' | 'resenas' | 'pedidos'>('info');
  const [guardando, setGuardando] = useState(false);
  const [vistaPreviaAbierta, setVistaPreviaAbierta] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [editandoPlatillo, setEditandoPlatillo] = useState<Partial<Platillo> | null>(null);
  const [idEliminar, setIdEliminar] = useState<string | null>(null);
  const [estadoPublicacion, setEstadoPublicacion] = useState<EstadoPublicacion | null>(null);
  const dialogoEliminar = useRef<HTMLDialogElement>(null);

  /* El diálogo nativo se encarga del foco, de Escape y de la capa superior.
     Antes era un div fijo: el tabulador se escapaba al fondo y Escape no
     cerraba nada. */
  useEffect(() => {
    const dialogo = dialogoEliminar.current;
    if (!dialogo) return;
    if (idEliminar && !dialogo.open) dialogo.showModal();
    else if (!idEliminar && dialogo.open) dialogo.close();
  }, [idEliminar]);

  /**
   * El cajón móvil se cierra con Escape y devuelve el foco al botón que lo
   * abrió: sin esto, quien navega con teclado se quedaba dentro de un menú
   * invisible o tenía que buscar el fondo para salir.
   */
  useEffect(() => {
    if (!menuMovilAbierto) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuMovilAbierto(false);
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [menuMovilAbierto]);

  /**
   * El panel es una aplicación de pantalla completa: el documento de detrás no
   * debe desplazarse nunca. Sin esto, en móvil el `body` (con `min-height:
   * 100vh`) era más alto que el alto visible mientras la barra del navegador
   * estaba a la vista, así que un gesto que empezaba en la cabecera —donde
   * están el menú y «Vista previa»— arrastraba toda la página y se llevaba esos
   * botones hacia arriba, sin forma cómoda de recuperarlos. Con el documento
   * bloqueado y `.af-pantalla` fija, la cabecera no se mueve jamás.
   */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const overflowHtml = html.style.overflow;
    const overflowBody = body.style.overflow;
    html.classList.add('panel-bloqueado');
    body.classList.add('panel-bloqueado');
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.classList.remove('panel-bloqueado');
      body.classList.remove('panel-bloqueado');
      html.style.overflow = overflowHtml;
      body.style.overflow = overflowBody;
    };
  }, []);

  const abrirVistaPrevia = () => {
    // En móvil el cajón tapa la vista previa: se cierra antes de mostrarla.
    setMenuMovilAbierto(false);
    setVistaPreviaAbierta(true);
  };

  /**
   * La barra lateral se pliega a un raíl de iconos en escritorio. Se recuerda
   * entre sesiones: quien trabaja con el panel a diario no quiere volver a
   * plegarla cada vez que entra.
   */
  const [barraContraida, setBarraContraida] = useState<boolean>(() => {
    try { return localStorage.getItem('tuki_barra_contraida') === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('tuki_barra_contraida', barraContraida ? '1' : '0'); } catch { /* sin almacenamiento */ }
  }, [barraContraida]);

  const handleLogout = async () => {
    navigate('/');
    setTimeout(async () => {
      await cerrarSesion();
    }, 100);
  };

  const guardarRestaurante = async (datos: Partial<Restaurante> = {}) => {
    if (!restaurante) return;
    const datosAGuardar = { ...restaurante, ...datos };
    setGuardando(true);
    try {
      const { error } = await apiRestaurante.actualizar(restaurante.id, datosAGuardar);
      if (error) throw error;
      setRestaurante(datosAGuardar as Restaurante);
    } finally {
      setGuardando(false);
    }
  };

  const aplicarTema = async (nuevoTema: Partial<Tema>) => {
    if (!tema) return;
    /* La ruta del servicio es /restaurantes/:id/tema y espera el id del
       RESTAURANTE. Antes se enviaba `tema.id` (el id de la fila del tema), así
       que el backend no encontraba el local y el cambio se perdía al recargar. */
    const restauranteId = restaurante?.id ?? tema.restaurante_id;
    const anterior = tema;
    setTema({ ...tema, ...nuevoTema });
    setGuardando(true);
    try {
      const { error } = await apiRestaurante.actualizarTema(restauranteId, nuevoTema);
      if (error) throw error;
      mostrarMensaje('exito', 'Estilo aplicado correctamente');
    } catch (error: any) {
      console.error("Error aplicando tema:", error);
      setTema(anterior);
      mostrarMensaje('error', formatError(error));
    } finally { setGuardando(false); }
  };

  // Sube la imagen del platillo a Storage y vuelca la URL en el formulario.
  // El guardado real ocurre al pulsar "Crear / Guardar" en el editor.
  const handleImagenUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editandoPlatillo) return;
    try {
      const url = await subirImagen(file, 'platillos');
      setEditandoPlatillo({ ...editandoPlatillo, imagen_url: url });
    } catch (error: any) { mostrarMensaje('error', formatError(error)); }
  };

  const guardarPlatillo = async (platillo: Partial<Platillo>) => {
    if (!restaurante) return;
    setGuardando(true);
    try {
      const { error } = await apiPlatillos.guardar({ ...platillo, restaurante_id: restaurante.id });
      if (error) throw error;
      mostrarMensaje('exito', 'Platillo guardado'); setEditandoPlatillo(null); cargarDatos();
    } catch (e: any) { mostrarMensaje('error', formatError(e)); } finally { setGuardando(false); }
  };

  const iniciarEliminacion = (id: string) => {
    setIdEliminar(id);
  };
  const confirmarEliminacion = async () => {
    if (!idEliminar) return;
    setGuardando(true);
    try {
      const { error } = await apiPlatillos.eliminar(idEliminar);
      if (error) throw error;
      setPlatillos(prev => prev.filter(p => p.id !== idEliminar));
      mostrarMensaje('exito', 'Platillo eliminado correctamente');
      setIdEliminar(null);
    } catch (e: any) {
      mostrarMensaje('error', formatError(e));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstadoPlatillo = async (p: Platillo, estado: EstadoPlatillo) => {
    const { disponible, visible } = camposDeEstado(estado, { disponible: p.disponible });
    // Optimista: la fila responde al toque y, si el servidor falla, se recarga.
    setPlatillos(prev => prev.map(item => item.id === p.id ? { ...item, disponible, visible } : item));
    try {
      await apiPlatillos.actualizarEstado(p.id, disponible, visible);
    } catch (e: any) {
      mostrarMensaje('error', formatError(e));
      cargarDatos();
    }
  };

  const sugerirIA = async (prompt: string, setter: (val: string) => void, sistema?: string) => {
    // La IA no bloquea el panel entero: quien la llama muestra su propia espera.
    try { const res = await generarContenidoIA(prompt, sistema); setter(res.replace(/^["']|["']$/g, '').replace(/\.$/, '')); } catch (e: any) { mostrarMensaje('error', `IA Error: ${formatError(e)}`); }
  }

  if (cargando && !restaurante) {
    return (
      <div className="af-pantalla flex bg-af-ground" role="status" aria-live="polite">
        <span className="sr-only">Cargando el panel del restaurante…</span>
        <div className="hidden w-72 shrink-0 border-r border-af/20 bg-af-surface p-6 md:block">
          <div className="h-9 w-32 animate-pulse rounded-lg bg-af-ink/10" />
          <div className="mt-8 space-y-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-af-ink/[0.06]" />
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1 p-5 md:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="h-6 w-56 animate-pulse rounded bg-af-ink/10" />
            <div className="h-4 w-80 max-w-full animate-pulse rounded bg-af-ink/[0.06]" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-6">
                <div className="h-56 animate-pulse rounded-[24px] bg-af-surface" />
                <div className="h-40 animate-pulse rounded-[24px] bg-af-surface" />
              </div>
              <div className="hidden h-72 animate-pulse rounded-[24px] bg-af-surface lg:block" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * En la lista de platos el contenedor se queda sin relleno superior: la
   * cabecera del menú tiene que nacer a ras del borde que desplaza para poder
   * anclarse ahí (`sticky top-0`) sin dar ni un salto y sin dejar una franja
   * por encima donde se vean las filas pasar. El aire de arriba lo pone la
   * propia cabecera, y el resto de pestañas conservan su relleno de siempre.
   */
  const esMenu = tabActiva === 'menu' && !editandoPlatillo;

  /** Las pestañas con barra de acción pegada abajo necesitan el borde libre. */
  const tieneBarraInferior = tabActiva === 'info' || Boolean(editandoPlatillo);

  return (
    <div style={estiloMarca} className="panel-tema af-pantalla flex bg-af-ground text-af-ink font-system transition-colors duration-300">
      {/* Overlay Móvil */}
      {menuMovilAbierto && <div className="fixed inset-0 z-40 bg-black/40 md:hidden backdrop-blur-sm" onClick={() => setMenuMovilAbierto(false)} />}

      {/* Sidebar de Navegación */}
      <BarraLateral
        tabActiva={tabActiva}
        setTabActiva={(tab) => { setTabActiva(tab); setEditandoPlatillo(null); setMenuMovilAbierto(false); }}
        restaurante={restaurante}
        setVistaPreviaAbierta={abrirVistaPrevia}
        movilAbierto={menuMovilAbierto}
        contraido={barraContraida}
        onAlternarContraido={() => setBarraContraida((v) => !v)}
        onCerrarMovil={() => setMenuMovilAbierto(false)}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {/* Notificaciones Toast */}
        {/* Superficie en vez de relleno de color: blanco sobre #30D158 da 1.9:1
            en oscuro y sobre #FF453A 2.9:1 en claro. El color semántico va en el
            icono, donde sólo necesita 3:1. */}
        {mensaje && (
          <div
            role="status"
            aria-live="polite"
            className="fade-in-af fixed right-4 top-[4.75rem] z-50 flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-2xl border border-af/20 bg-af-surface/95 px-4 py-3 text-sm font-medium text-af-ink shadow-xl backdrop-blur-xl md:right-6 md:top-[5.5rem]"
          >
            {mensaje.tipo === 'exito'
              ? <Check size={18} strokeWidth={2.6} className="mt-0.5 shrink-0 text-af-success" aria-hidden="true" />
              : <AlertTriangle size={18} strokeWidth={2.4} className="mt-0.5 shrink-0 text-af-danger-text" aria-hidden="true" />}
            <span className="min-w-0 flex-1 leading-snug">{mensaje.texto}</span>
            <button
              type="button"
              onClick={cerrarMensaje}
              aria-label="Cerrar aviso"
              className="-mr-1 -mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-af-ink-secondary outline-none transition-colors hover:bg-af-ink/[0.06] hover:text-af-ink dark:hover:bg-white/10"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        )}

        <header className="nav-af sticky top-0 z-30 shrink-0">
          <div className="mx-auto flex min-h-[4rem] w-full max-w-6xl items-center gap-2.5 px-4 py-2 md:min-h-[4.75rem] md:gap-4 md:px-8">
            <button
              type="button"
              onClick={() => setMenuMovilAbierto((abierto) => !abierto)}
              aria-label={menuMovilAbierto ? 'Cerrar el menú' : 'Abrir el menú'}
              aria-expanded={menuMovilAbierto}
              aria-controls="panel-menu-movil"
              className="af-pulsar flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-af-ink-secondary outline-none transition-colors hover:bg-af-ink/[0.06] hover:text-af-ink md:hidden dark:hover:bg-white/[0.08]"
            >
              <Menu size={22} aria-hidden="true" />
            </button>

            <div className="min-w-0 flex-1">
              {editandoPlatillo ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-af-accent-text">
                    Menú
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditandoPlatillo(null)}
                      aria-label="Volver al menú"
                      className="af-pulsar -ml-1 flex h-8 w-8 items-center justify-center rounded-full text-af-ink-secondary outline-none transition-colors hover:bg-af-ink/[0.06] hover:text-af-ink dark:hover:bg-white/10"
                    >
                      <ArrowLeft size={18} aria-hidden="true" />
                    </button>
                    <h1 className="truncate text-[17px] font-bold leading-tight text-af-ink md:text-[20px]">
                      {editandoPlatillo.id ? 'Editar platillo' : 'Nuevo platillo'}
                    </h1>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-af-accent-text">
                    {SECCIONES[tabActiva].eyebrow}
                  </p>
                  <h1 className="mt-0.5 line-clamp-2 text-[17px] font-bold leading-tight text-af-ink md:text-[20px]">
                    {SECCIONES[tabActiva].titulo}
                  </h1>
                  <p className="hidden truncate text-[12px] leading-snug text-af-ink-secondary md:block">
                    {SECCIONES[tabActiva].descripcion}
                  </p>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden md:block">
                <BarraPendientes estado={estadoPublicacion} visible={tabActiva === 'info' && !editandoPlatillo} />
              </div>
              <button
                type="button"
                onClick={abrirVistaPrevia}
                className="af-pulsar hidden items-center gap-2 rounded-xl border border-af/25 bg-af-surface px-3.5 py-2 text-xs font-bold text-af-ink shadow-sm outline-none transition-colors hover:border-af-accent/40 hover:text-af-accent-text md:flex"
              >
                <Eye size={15} aria-hidden="true" /> Vista previa
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="af-pulsar hidden items-center gap-2 rounded-xl border border-af-danger/20 px-3 py-2 text-xs font-bold text-af-danger-text outline-none transition-colors hover:bg-af-danger/10 md:flex"
                title="Cerrar sesión"
              >
                <LogOut size={16} aria-hidden="true" /> Salir
              </button>
              <button
                type="button"
                onClick={abrirVistaPrevia}
                aria-label="Vista previa de mi sitio"
                className="af-pulsar flex h-11 w-11 items-center justify-center rounded-xl border border-af/25 bg-af-surface text-af-ink shadow-sm outline-none transition-colors hover:text-af-accent-text md:hidden"
              >
                <Eye size={19} aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <div data-panel-scroll className={`flex-1 overscroll-contain px-4 pb-0 md:px-8 md:pb-0 scroll-smooth ${menuMovilAbierto ? 'overflow-hidden' : 'overflow-y-auto'} ${esMenu ? 'pt-0' : 'pt-4 md:pt-8'}`}>
          {/* El aire inferior va en el contenido, no en el contenedor que
              desplaza: un `padding-bottom` aquí pertenece al área de scroll y
              las barras `sticky bottom-0` se anclaban por encima del borde
              real de la pantalla. En las pestañas con barra inferior el aire se
              quita del todo para que la barra quede pegada al borde; en el
              resto se conserva para que la última tarjeta no toque el final. */}
          <div className={`max-w-6xl mx-auto space-y-8 ${tieneBarraInferior ? 'pb-0' : 'pb-24 md:pb-20'}`}>
            {tabActiva === 'menu' && editandoPlatillo && restaurante ? <EditorPlatillo platillo={editandoPlatillo} setPlatillo={setEditandoPlatillo} guardar={guardarPlatillo} cancelar={() => setEditandoPlatillo(null)} sugerirIA={sugerirIA} handleImagenUpload={handleImagenUpload} guardando={guardando} restauranteNombre={restaurante.nombre} categorias={categorias.map((c) => c.nombre)} /> : null}
            {/* SeccionInfo se mantiene montada para no perder los cambios sin guardar al cambiar de pestaña.
                Se oculta con el ATRIBUTO `hidden`, no con la clase: las utilidades `space-y-*` de
                Tailwind saltan `[hidden]`, mientras que la clase cuenta como hermano y le dejaba
                a la sección siguiente un hueco extra de 2rem arriba. La cabecera del menú tiene
                que nacer a ras del borde desplazable para no moverse ni un píxel al hacer scroll. */}
            {restaurante && (
              <div hidden={!(tabActiva === 'info' && !editandoPlatillo)}>
                <SeccionInfo restaurante={restaurante} guardarRestaurante={guardarRestaurante} subirImagen={subirImagen} sugerirIA={sugerirIA} guardando={guardando} mostrarMensaje={mostrarMensaje} onEstadoPublicacion={setEstadoPublicacion} />
              </div>
            )}
            {tabActiva === 'tema' && tema && !editandoPlatillo && <SeccionDiseno tema={tema} aplicarTema={aplicarTema} guardando={guardando} />}
            {tabActiva === 'menu' && !editandoPlatillo && <SeccionMenu platillos={platillos} setEditandoPlatillo={setEditandoPlatillo} cambiarEstadoPlatillo={cambiarEstadoPlatillo} eliminarPlatillo={iniciarEliminacion} />}
            {tabActiva === 'resenas' && restaurante && !editandoPlatillo && <SeccionResenas restaurante={restaurante} platillos={platillos} mostrarMensaje={mostrarMensaje} />}
            {tabActiva === 'pedidos' && restaurante && !editandoPlatillo && <SeccionPedidos restaurante={restaurante} mostrarMensaje={mostrarMensaje} />}
            {tabActiva === 'difusion' && restaurante && <SeccionDifusion restaurante={restaurante} mostrarMensaje={mostrarMensaje} />}
          </div>
        </div>

        {/* Vista Previa a Pantalla Completa */}
        {vistaPreviaAbierta && restaurante && tema && (
          <div className="fixed inset-0 z-[100] bg-af-ground overflow-y-auto overscroll-contain fade-in-af">
            <PlantillaRestaurante restaurante={restaurante} tema={tema} platillos={platillos.filter(p => p.disponible && p.visible)} modoPreview={true} onClosePreview={() => setVistaPreviaAbierta(false)} />
          </div>
        )}

        {/* Confirmación de eliminación: `<dialog>` nativo (foco atrapado, Escape
            y capa superior los pone el navegador). */}
        <dialog
          ref={dialogoEliminar}
          {...({ closedby: 'any' } as any)}
          onClose={() => setIdEliminar(null)}
          onClick={(e) => { if (e.target === e.currentTarget) setIdEliminar(null); }}
          aria-labelledby="eliminar-titulo"
          className="dialogo-panel z-[200] w-[min(24rem,calc(100vw-2rem))] rounded-[28px] border border-af/20 bg-af-surface p-0 text-af-ink shadow-2xl"
        >
          <div className="p-7">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-af-danger/10 text-af-danger-text">
              <Trash2 size={30} aria-hidden="true" />
            </div>
            <h3 id="eliminar-titulo" className="mb-2 text-center text-xl font-bold text-af-ink">
              ¿Eliminar platillo?
            </h3>
            <p className="mb-7 text-center text-sm leading-relaxed text-af-ink-secondary">
              Esta acción eliminará el platillo de tu menú permanentemente. No se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setIdEliminar(null)}
                disabled={guardando}
                className="flex-1 rounded-xl border border-af/25 py-3 font-bold text-af-ink-secondary transition-colors hover:bg-af-ink/[0.06] hover:text-af-ink dark:hover:bg-white/[0.08]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminacion}
                disabled={guardando}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-af-danger py-3 font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
              >
                {guardando ? 'Borrando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </dialog>
      </main>
    </div>
  );
}
