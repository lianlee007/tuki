import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AudioLines,
  Loader2,
  MessageCircle,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Square,
  Utensils,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { mensajeDeError, type FuenteIa, type MensajeIa } from '@tuki/api-cliente';
import { apis } from '../../lib/api-tuki';
import { useDictadoVoz, useLecturaVoz } from './voz';

const SUGERENCIAS = [
  '¿Qué me recomiendas?',
  'Algo vegetariano y barato',
  'Quiero un postre',
  '¿Qué hay en Popayán?',
];

const BIENVENIDA =
  'Hola, soy Tuki. Cuéntame qué se te antoja y busco platos reales del catálogo. ' +
  'Puedes pedirme algo vegetariano, picante, económico o para compartir.';

interface MensajeUi {
  rol: 'user' | 'assistant';
  contenido: string;
  fuentes?: FuenteIa[];
  latenciaMs?: number;
  modelo?: string;
  error?: boolean;
}

const precio = (valor?: number | null, moneda = 'COP'): string => {
  if (valor === null || valor === undefined) return '';
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda || 'COP',
      maximumFractionDigits: 0,
    }).format(valor);
  } catch {
    return `$${Math.round(valor)}`;
  }
};

const TarjetaFuente = ({ fuente }: { fuente: FuenteIa }) => {
  const contenido = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-semibold text-hearth-espresso dark:text-hearth-night-ink">
          {fuente.nombre}
        </span>
        {fuente.precio !== null && fuente.precio !== undefined ? (
          <span className="shrink-0 text-xs font-bold text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink">
            {precio(fuente.precio, fuente.moneda)}
          </span>
        ) : null}
      </div>
      <p className="mt-0.5 text-xs text-hearth-pebble dark:text-hearth-night-pebble">
        {fuente.restaurante}
        {fuente.ciudad ? ` · ${fuente.ciudad}` : ''}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {fuente.vegetariano ? (
          <span className="rounded-full bg-hearth-sage-soft px-2 py-0.5 text-[10px] font-semibold text-hearth-sage-ink dark:bg-hearth-night-sage-soft dark:text-hearth-night-sage-ink">
            Vegetariano
          </span>
        ) : null}
        {fuente.vegano ? (
          <span className="rounded-full bg-hearth-sage-soft px-2 py-0.5 text-[10px] font-semibold text-hearth-sage-ink dark:bg-hearth-night-sage-soft dark:text-hearth-night-sage-ink">
            Vegano
          </span>
        ) : null}
        {fuente.picante ? (
          <span className="rounded-full bg-hearth-terracotta-soft px-2 py-0.5 text-[10px] font-semibold text-hearth-terracotta-ink dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink">
            Picante
          </span>
        ) : null}
        {fuente.alergenos.length > 0 ? (
          <span className="rounded-full bg-hearth-honey-soft px-2 py-0.5 text-[10px] font-semibold text-hearth-honey-ink dark:bg-hearth-night-honey-soft dark:text-hearth-night-honey-ink">
            Contiene: {fuente.alergenos.join(', ')}
          </span>
        ) : null}
      </div>
    </>
  );

  if (fuente.tipo === 'plato' && fuente.restauranteSlug) {
    return (
      <Link
        to={`/restaurante/${fuente.restauranteSlug}`}
        className="block rounded-2xl border border-hearth-line bg-white/70 p-3 transition hover:border-hearth-terracotta hover:bg-white dark:border-hearth-night-line dark:bg-hearth-night-card/70 dark:hover:border-hearth-night-terracotta dark:hover:bg-hearth-night-card"
      >
        {contenido}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-hearth-line bg-white/70 p-3 dark:border-hearth-night-line dark:bg-hearth-night-card/70">
      {contenido}
    </div>
  );
};

export const ChatRecomendador = () => {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeUi[]>([
    { rol: 'assistant', contenido: BIENVENIDA },
  ]);
  const finRef = useRef<HTMLDivElement | null>(null);
  const entradaRef = useRef<HTMLInputElement | null>(null);

  const [autoLeer, setAutoLeer] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem('tuki-chat-leer') === '1';
    } catch {
      return false;
    }
  });
  const [manosLibres, setManosLibres] = useState(false);
  const [avisoVoz, setAvisoVoz] = useState<string | null>(null);
  const enviarRef = useRef<(valor: string) => Promise<void>>(async () => {});
  const autoLeerRef = useRef(autoLeer);
  const manosLibresRef = useRef(manosLibres);
  const pausaVozRef = useRef(false);
  autoLeerRef.current = autoLeer;
  manosLibresRef.current = manosLibres;

  const lectura = useLecturaVoz();
  const dictado = useDictadoVoz({
    lang: 'es-CO',
    onTextoFinal: (transcripcion) => {
      setTexto(transcripcion);
      if (manosLibresRef.current) {
        void enviarRef.current(transcripcion);
      }
    },
    onError: (mensaje) => setAvisoVoz(mensaje),
  });

  const avisarVoz = (mensaje: string) => {
    setAvisoVoz(mensaje);
    window.setTimeout(() => {
      setAvisoVoz((actual) => (actual === mensaje ? null : actual));
    }, 6000);
  };

  useEffect(() => {
    try {
      window.localStorage.setItem('tuki-chat-leer', autoLeer ? '1' : '0');
    } catch {
      // El navegador puede bloquear el almacenamiento; la voz sigue funcionando.
    }
  }, [autoLeer]);

  useEffect(() => {
    if (abierto) {
      window.setTimeout(() => entradaRef.current?.focus(), 120);
    }
  }, [abierto]);

  useEffect(() => {
    if (abierto) {
      finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [mensajes, enviando, abierto]);

  const enviar = async (valor: string) => {
    const limpio = valor.trim();
    if (!limpio || enviando) return;

    lectura.detener();
    dictado.detener();
    setAvisoVoz(null);

    const nuevoUsuario: MensajeUi = { rol: 'user', contenido: limpio };
    const historial: MensajeIa[] = mensajes
      .filter((mensaje) => !mensaje.error)
      .slice(-6)
      .map((mensaje) => ({ rol: mensaje.rol, contenido: mensaje.contenido }));

    setMensajes((previos) => [...previos, nuevoUsuario]);
    setTexto('');
    setEnviando(true);

    try {
      const recomendacion = await apis.ia.recomendar({
        mensaje: limpio,
        historial,
      });
      setMensajes((previos) => [
        ...previos,
        {
          rol: 'assistant',
          contenido: recomendacion.respuesta,
          fuentes: recomendacion.fuentes,
          latenciaMs: recomendacion.latencyMs,
          modelo: recomendacion.modelo,
        },
      ]);

      // La lectura se dispara después de pintar la respuesta. En modo manos
      // libres, al terminar de leer se vuelve a abrir el micrófono.
      const debeLeer = autoLeerRef.current || manosLibresRef.current;
      if (debeLeer) {
        const hablando = lectura.hablar(recomendacion.respuesta, {
          onFin: () => {
            if (manosLibresRef.current && !pausaVozRef.current) {
              window.setTimeout(() => dictado.iniciar(), 350);
            }
          },
        });
        if (!hablando && manosLibresRef.current && !pausaVozRef.current) {
          window.setTimeout(() => dictado.iniciar(), 800);
        }
      } else if (manosLibresRef.current && !pausaVozRef.current) {
        window.setTimeout(() => dictado.iniciar(), 800);
      }
    } catch (error: unknown) {
      setMensajes((previos) => [
        ...previos,
        {
          rol: 'assistant',
          contenido: mensajeDeError(error),
          error: true,
        },
      ]);
    } finally {
      setEnviando(false);
    }
  };

  enviarRef.current = enviar;

  const cerrarChat = () => {
    pausaVozRef.current = true;
    setManosLibres(false);
    setAvisoVoz(null);
    dictado.detener();
    lectura.detener();
    setAbierto(false);
  };

  const alternarChat = () => {
    if (abierto) cerrarChat();
    else setAbierto(true);
  };

  const alternarDictado = () => {
    if (dictado.escuchando) {
      pausaVozRef.current = true;
      dictado.detener();
      return;
    }
    pausaVozRef.current = false;
    lectura.detener();
    setAvisoVoz(null);
    dictado.iniciar();
  };

  const alternarAutoLeer = () => {
    if (!lectura.soportado) {
      avisarVoz('Tu navegador no permite leer respuestas en voz alta.');
      return;
    }
    const siguiente = !autoLeer;
    setAutoLeer(siguiente);
    if (!siguiente) lectura.detener();
  };

  const alternarManosLibres = () => {
    if (!dictado.soportado) {
      avisarVoz('Tu navegador no permite dictado por voz. Escribe la pregunta.');
      return;
    }
    const siguiente = !manosLibres;
    setManosLibres(siguiente);
    if (siguiente) {
      pausaVozRef.current = false;
      setAutoLeer(true);
      avisarVoz('Manos libres activado. Pulsa el micrófono y habla.');
    } else {
      pausaVozRef.current = true;
      dictado.detener();
      lectura.detener();
      setAvisoVoz(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={alternarChat}
        aria-label={abierto ? 'Cerrar el chat de Tuki' : 'Abrir el chat de Tuki'}
        aria-expanded={abierto}
        className="fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-full bg-hearth-terracotta px-4 py-3 text-sm font-semibold text-white shadow-warm-xl transition hover:bg-hearth-terracotta-deep sm:bottom-6 sm:right-6"
      >
        {abierto ? <X size={18} aria-hidden /> : <MessageCircle size={18} aria-hidden />}
        <span className="hidden sm:inline">{abierto ? 'Cerrar' : 'Pregúntale a Tuki'}</span>
      </button>

      {abierto ? (
        <section
          role="dialog"
          aria-label="Chat para recomendar platos"
          className="fixed bottom-40 right-4 z-50 flex h-[min(560px,calc(100vh-12rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-4xl border border-hearth-line bg-hearth-cream shadow-warm-xl dark:border-hearth-night-line dark:bg-hearth-night sm:bottom-24 sm:right-6"
        >
          <header className="flex items-center gap-3 border-b border-hearth-line bg-white/80 px-4 py-3 dark:border-hearth-night-line dark:bg-hearth-night-soft/90">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-hearth-terracotta text-white">
              <Utensils size={20} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate font-jakarta text-sm font-bold text-hearth-espresso dark:text-hearth-night-ink">
                Tuki, tu recomendador
              </p>
              <p className="truncate text-[11px] text-hearth-pebble dark:text-hearth-night-pebble">
                Platos reales del catálogo
              </p>
            </div>
            <div className="ml-auto flex items-center gap-0.5">
              <button
                type="button"
                onClick={alternarAutoLeer}
                aria-pressed={autoLeer}
                aria-label={
                  autoLeer
                    ? 'Desactivar la lectura de respuestas'
                    : 'Leer las respuestas en voz alta'
                }
                title={
                  autoLeer
                    ? 'No leer las respuestas en voz alta'
                    : 'Leer las respuestas en voz alta'
                }
                className={`rounded-full p-2 transition ${
                  autoLeer
                    ? 'bg-hearth-terracotta-soft text-hearth-terracotta-ink dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink'
                    : 'text-hearth-pebble hover:bg-hearth-oat dark:text-hearth-night-pebble dark:hover:bg-hearth-night-oat'
                }`}
              >
                {autoLeer ? (
                  <Volume2 size={17} aria-hidden />
                ) : (
                  <VolumeX size={17} aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={alternarManosLibres}
                aria-pressed={manosLibres}
                aria-label={
                  manosLibres
                    ? 'Desactivar el modo manos libres'
                    : 'Activar el modo manos libres'
                }
                title={
                  manosLibres
                    ? 'Desactivar manos libres'
                    : 'Manos libres: hablar, enviar y escuchar la respuesta'
                }
                className={`rounded-full p-2 transition ${
                  manosLibres
                    ? 'bg-hearth-terracotta-soft text-hearth-terracotta-ink dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink'
                    : 'text-hearth-pebble hover:bg-hearth-oat dark:text-hearth-night-pebble dark:hover:bg-hearth-night-oat'
                }`}
              >
                <AudioLines size={17} aria-hidden />
              </button>
              <button
                type="button"
                onClick={cerrarChat}
                className="rounded-full p-2 text-hearth-pebble transition hover:bg-hearth-oat dark:text-hearth-night-pebble dark:hover:bg-hearth-night-oat"
                aria-label="Cerrar el chat"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {mensajes.map((mensaje, indice) => (
              <div
                key={`${mensaje.rol}-${indice}`}
                className={mensaje.rol === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div className="max-w-[92%] space-y-2">
                  <div
                    className={
                      mensaje.rol === 'user'
                        ? 'rounded-3xl rounded-br-lg bg-hearth-terracotta px-4 py-3 text-sm leading-relaxed text-white'
                        : mensaje.error
                          ? 'rounded-3xl rounded-bl-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200'
                          : 'rounded-3xl rounded-bl-lg bg-hearth-oat px-4 py-3 text-sm leading-relaxed text-hearth-espresso dark:bg-hearth-night-oat dark:text-hearth-night-ink'
                    }
                  >
                    {mensaje.contenido}
                  </div>

                  {mensaje.fuentes && mensaje.fuentes.length > 0 ? (
                    <div className="space-y-2">
                      <p className="flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-hearth-pebble dark:text-hearth-night-pebble">
                        <Sparkles size={12} aria-hidden />
                        Fuentes del catálogo
                      </p>
                      {mensaje.fuentes.map((fuente) => (
                        <TarjetaFuente key={`${fuente.tipo}-${fuente.id}`} fuente={fuente} />
                      ))}
                    </div>
                  ) : null}

                  {mensaje.rol === 'user' && lectura.soportado ? (
                    <button
                      type="button"
                      onClick={() => lectura.hablar(mensaje.contenido)}
                      className="ml-auto flex items-center gap-1 px-1 text-[10px] font-semibold text-hearth-pebble transition hover:text-hearth-terracotta-ink dark:text-hearth-night-pebble dark:hover:text-hearth-night-terracotta-ink"
                      aria-label="Escuchar lo que escribiste"
                    >
                      <Volume2 size={11} aria-hidden />
                      Repetir
                    </button>
                  ) : null}

                  {mensaje.rol === 'assistant' && !mensaje.error && lectura.soportado ? (
                    <button
                      type="button"
                      onClick={() => lectura.hablar(mensaje.contenido)}
                      className="inline-flex items-center gap-1 px-1 text-[10px] font-semibold text-hearth-pebble transition hover:text-hearth-terracotta-ink dark:text-hearth-night-pebble dark:hover:text-hearth-night-terracotta-ink"
                      aria-label="Escuchar esta respuesta en voz alta"
                    >
                      <Volume2 size={11} aria-hidden />
                      Escuchar
                    </button>
                  ) : null}

                  {mensaje.latenciaMs ? (
                    <p className="px-1 text-[10px] text-hearth-pebble/80 dark:text-hearth-night-pebble/80">
                      {mensaje.modelo} · {(mensaje.latenciaMs / 1000).toFixed(1)} s
                    </p>
                  ) : null}
                </div>
              </div>
            ))}

            {enviando ? (
              <div className="flex items-center gap-2 text-xs text-hearth-pebble dark:text-hearth-night-pebble">
                <Loader2 size={14} className="animate-spin" aria-hidden />
                Buscando en el catálogo…
              </div>
            ) : null}
            <div ref={finRef} />
          </div>

          {mensajes.length <= 1 ? (
            <div className="flex flex-wrap gap-2 border-t border-hearth-line px-4 py-3 dark:border-hearth-night-line">
              {SUGERENCIAS.map((sugerencia) => (
                <button
                  key={sugerencia}
                  type="button"
                  onClick={() => void enviar(sugerencia)}
                  className="rounded-full border border-hearth-line bg-white/70 px-3 py-1.5 text-[11px] font-medium text-hearth-espresso transition hover:border-hearth-terracotta hover:text-hearth-terracotta-ink dark:border-hearth-night-line dark:bg-hearth-night-card/70 dark:text-hearth-night-ink dark:hover:border-hearth-night-terracotta"
                >
                  {sugerencia}
                </button>
              ))}
            </div>
          ) : null}

          {dictado.escuchando || lectura.hablando || dictado.error || avisoVoz ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-hearth-line bg-hearth-oat/70 px-4 py-2 text-[11px] text-hearth-espresso dark:border-hearth-night-line dark:bg-hearth-night-oat/60 dark:text-hearth-night-ink"
            >
              {dictado.escuchando ? (
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500"
                    aria-hidden
                  />
                  <span className="font-semibold">Escuchando…</span>
                  {dictado.parcial ? (
                    <span className="truncate text-hearth-pebble dark:text-hearth-night-pebble">
                      “{dictado.parcial}”
                    </span>
                  ) : null}
                </span>
              ) : null}

              {lectura.hablando ? (
                <span className="flex items-center gap-1.5">
                  <Volume2 size={12} aria-hidden />
                  <span className="font-semibold">Leyendo la respuesta…</span>
                </span>
              ) : null}

              {!dictado.escuchando && !lectura.hablando && (dictado.error || avisoVoz) ? (
                <span className="min-w-0 flex-1 text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink">
                  {dictado.error ?? avisoVoz}
                </span>
              ) : null}

              {dictado.escuchando || lectura.hablando ? (
                <button
                  type="button"
                  onClick={() => {
                    pausaVozRef.current = true;
                    dictado.detener();
                    lectura.detener();
                  }}
                  className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-hearth-espresso transition hover:bg-white dark:bg-hearth-night-card dark:text-hearth-night-ink"
                >
                  <Square size={9} aria-hidden />
                  Detener
                </button>
              ) : null}
            </div>
          ) : null}

          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              void enviar(texto);
            }}
            className="flex items-center gap-2 border-t border-hearth-line bg-white/80 px-3 py-3 dark:border-hearth-night-line dark:bg-hearth-night-soft/90"
          >
            <button
              type="button"
              onClick={alternarDictado}
              disabled={enviando}
              aria-label={dictado.escuchando ? 'Detener el dictado' : 'Hablar con Tuki'}
              aria-pressed={dictado.escuchando}
              title={
                dictado.soportado
                  ? dictado.escuchando
                    ? 'Detener el dictado'
                    : 'Hablar con Tuki'
                  : 'Tu navegador no permite dictado por voz'
              }
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${
                dictado.escuchando
                  ? 'bg-red-600 text-white shadow-warm'
                  : 'bg-hearth-oat text-hearth-espresso hover:bg-hearth-oat-deep dark:bg-hearth-night-oat dark:text-hearth-night-ink'
              } ${!dictado.soportado ? 'opacity-50' : ''}`}
            >
              {dictado.escuchando ? (
                <MicOff size={18} aria-hidden />
              ) : (
                <Mic size={18} aria-hidden />
              )}
            </button>

            <input
              ref={entradaRef}
              value={texto}
              onChange={(evento) => setTexto(evento.target.value)}
              maxLength={500}
              placeholder="Ej. algo vegetariano para almorzar"
              aria-label="Escribe tu pregunta"
              className="min-w-0 flex-1 rounded-full border border-hearth-line bg-hearth-cream px-4 py-2.5 text-sm text-hearth-espresso outline-none transition placeholder:text-hearth-pebble/70 focus:border-hearth-terracotta dark:border-hearth-night-line dark:bg-hearth-night dark:text-hearth-night-ink dark:placeholder:text-hearth-night-pebble/70"
            />
            <button
              type="submit"
              disabled={!texto.trim() || enviando}
              aria-label="Enviar pregunta"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hearth-terracotta text-white transition hover:bg-hearth-terracotta-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              {enviando ? (
                <Loader2 size={18} className="animate-spin" aria-hidden />
              ) : (
                <Send size={18} aria-hidden />
              )}
            </button>
          </form>
        </section>
      ) : null}
    </>
  );
};

export default ChatRecomendador;
