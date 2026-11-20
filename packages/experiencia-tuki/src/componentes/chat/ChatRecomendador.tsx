import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MessageCircle, Send, Sparkles, Utensils, X } from 'lucide-react';
import { mensajeDeError, type FuenteIa, type MensajeIa } from '@tuki/api-cliente';
import { apis } from '../../lib/api-tuki';

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

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
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
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="ml-auto rounded-full p-2 text-hearth-pebble transition hover:bg-hearth-oat dark:text-hearth-night-pebble dark:hover:bg-hearth-night-oat"
              aria-label="Cerrar el chat"
            >
              <X size={18} aria-hidden />
            </button>
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

          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              void enviar(texto);
            }}
            className="flex items-center gap-2 border-t border-hearth-line bg-white/80 px-3 py-3 dark:border-hearth-night-line dark:bg-hearth-night-soft/90"
          >
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
