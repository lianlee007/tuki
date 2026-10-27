import React, { useCallback, useEffect, useMemo, useState } from 'react';
// @ts-ignore — react-router-dom no publica tipos en este proyecto.
import { Link } from 'react-router-dom';
import {
  Check,
  EyeOff,
  ExternalLink,
  Image as ImageIcon,
  MessageSquare,
  MessageSquareQuote,
  RefreshCw,
  Store,
} from 'lucide-react';
import { Avatar } from '../sistema-diseno/Avatar';
import { Estrellas } from '../sistema-diseno/Estrellas';
import { apiResenas } from '../../api/apiResenas';
import {
  MAX_RESPUESTA,
  esPublica,
  fechaResena,
  nombreCliente,
  resumenRestaurante,
  tieneRespuesta,
  validarRespuesta,
  type Resena,
} from '../../lib/resenas';
import type { Platillo, Restaurante } from '../../tipos/modelos';
import { generarSlug } from '../../lib/utils';

type Filtro = 'pendientes' | 'publicadas' | 'todas';

interface Props {
  restaurante: Restaurante;
  platillos: Platillo[];
  mostrarMensaje: (tipo: 'exito' | 'error', texto: string) => void;
}

/**
 * Bandeja de reseñas del dueño.
 *
 * Toda reseña nueva entra como pendiente. Publicar la vuelve visible en la
 * ficha; ocultarla la saca sin borrarla, para que el dueño pueda corregir un
 * error de moderación sin perder el historial.
 */
export const SeccionResenas: React.FC<Props> = ({
  restaurante,
  platillos,
  mostrarMensaje,
}) => {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('pendientes');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [respondiendoId, setRespondiendoId] = useState<string | null>(null);
  const [borradorRespuesta, setBorradorRespuesta] = useState('');
  const [errorRespuesta, setErrorRespuesta] = useState<string | null>(null);
  const [guardandoRespuesta, setGuardandoRespuesta] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { resenas: encontradas, error: fallo } = await apiResenas.listar(
        restaurante.id
      );
      if (fallo) throw fallo;
      setResenas(encontradas);
    } catch {
      setError('No pudimos cargar las reseñas. Inténtalo otra vez.');
      setResenas([]);
    } finally {
      setCargando(false);
    }
  }, [restaurante.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const publicadas = useMemo(
    () => resenas.filter((resena) => esPublica(resena)),
    [resenas]
  );
  const pendientes = useMemo(
    () => resenas.filter((resena) => !esPublica(resena)),
    [resenas]
  );
  const resumen = useMemo(() => resumenRestaurante(publicadas), [publicadas]);
  const conFoto = useMemo(
    () => publicadas.filter((resena) => Boolean(resena.foto_url)).length,
    [publicadas]
  );

  const nombresPlatos = useMemo(() => {
    const mapa = new Map<string, string>();
    platillos.forEach((platillo) => mapa.set(platillo.id, platillo.nombre));
    return mapa;
  }, [platillos]);

  const visibles =
    filtro === 'pendientes'
      ? pendientes
      : filtro === 'publicadas'
        ? publicadas
        : resenas;

  const moderar = async (resena: Resena, aprobada: boolean) => {
    setProcesandoId(resena.id);
    const anteriores = resenas;

    // Optimista: la fila responde al toque. Si el servidor falla, se restaura.
    setResenas((prev) =>
      prev.map((item) =>
        item.id === resena.id
          ? { ...item, aprobado: aprobada, visible: aprobada }
          : item
      )
    );

    try {
      const { error: fallo } = await apiResenas.moderar(resena.id, aprobada);
      if (fallo) throw fallo;
      mostrarMensaje(
        'exito',
        aprobada ? 'Reseña publicada en la ficha' : 'Reseña ocultada de la ficha'
      );
    } catch {
      setResenas(anteriores);
      mostrarMensaje(
        'error',
        'No pudimos cambiar la reseña. Revisa la conexión e inténtalo otra vez.'
      );
    } finally {
      setProcesandoId(null);
    }
  };

  const abrirRespuesta = (resena: Resena) => {
    setRespondiendoId(resena.id);
    setBorradorRespuesta(resena.respuesta_dueno ?? '');
    setErrorRespuesta(null);
  };

  const cerrarRespuesta = () => {
    setRespondiendoId(null);
    setBorradorRespuesta('');
    setErrorRespuesta(null);
  };

  /**
   * La respuesta se publica junto a la reseña aprobada. Se guarda de forma
   * optimista para que el dueño vea el texto al instante, y si el servidor
   * falla se restaura la lista anterior: nunca se queda un texto que no existe.
   */
  const guardarRespuesta = async (resena: Resena) => {
    const fallo = validarRespuesta(borradorRespuesta);
    if (fallo) {
      setErrorRespuesta(fallo);
      return;
    }

    const texto = borradorRespuesta.trim();
    const anteriores = resenas;
    setGuardandoRespuesta(resena.id);
    setErrorRespuesta(null);
    setResenas((prev) =>
      prev.map((item) =>
        item.id === resena.id ? { ...item, respuesta_dueno: texto } : item
      )
    );

    try {
      const { error: falloApi } = await apiResenas.responder(resena.id, texto);
      if (falloApi) throw falloApi;
      mostrarMensaje('exito', 'Respuesta publicada junto a la reseña');
      cerrarRespuesta();
    } catch {
      setResenas(anteriores);
      setErrorRespuesta('No pudimos guardar la respuesta. Inténtalo otra vez.');
    } finally {
      setGuardandoRespuesta(null);
    }
  };

  const quitarRespuesta = async (resena: Resena) => {
    const anteriores = resenas;
    setGuardandoRespuesta(resena.id);
    setResenas((prev) =>
      prev.map((item) =>
        item.id === resena.id ? { ...item, respuesta_dueno: null } : item
      )
    );

    try {
      const { error: falloApi } = await apiResenas.responder(resena.id, null);
      if (falloApi) throw falloApi;
      mostrarMensaje('exito', 'Respuesta eliminada');
      cerrarRespuesta();
    } catch {
      setResenas(anteriores);
      mostrarMensaje('error', 'No pudimos quitar la respuesta.');
    } finally {
      setGuardandoRespuesta(null);
    }
  };

  const tabs: { id: Filtro; texto: string; cantidad: number }[] = [
    { id: 'pendientes', texto: 'Pendientes', cantidad: pendientes.length },
    { id: 'publicadas', texto: 'Publicadas', cantidad: publicadas.length },
    { id: 'todas', texto: 'Todas', cantidad: resenas.length },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-af-ink">Reseñas</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-af-ink-secondary">
            Lo que dicen quienes ya pidieron. Publica lo que aporte y oculta lo
            que no; ninguna reseña se borra.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargar}
            className="inline-flex items-center gap-2 rounded-xl bg-af-surface px-3.5 py-2 text-xs font-semibold text-af-ink-secondary transition-colors hover:text-af-ink af-pulsar"
          >
            <RefreshCw size={15} />
            Actualizar
          </button>
          <Link
            to={`/restaurante/${generarSlug(restaurante.nombre)}#resenas`}
            className="inline-flex items-center gap-2 rounded-xl bg-af-accent-solid px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 af-pulsar"
          >
            <ExternalLink size={15} />
            Ver en la ficha
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-af-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-af-ink-secondary">
            Promedio publicado
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-bold tabular-nums text-af-ink">
              {resumen.cantidad > 0 ? resumen.promedio.toFixed(1) : '—'}
            </span>
            <Estrellas
              valor={resumen.promedio}
              tamano={15}
              className="text-af-accent-text"
            />
          </div>
        </div>
        <div className="rounded-2xl bg-af-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-af-ink-secondary">
            Publicadas
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-af-ink">
            {publicadas.length}
          </p>
        </div>
        <div className="rounded-2xl bg-af-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-af-ink-secondary">
            Por revisar
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-af-ink">
            {pendientes.length}
          </p>
        </div>
        <div className="rounded-2xl bg-af-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-af-ink-secondary">
            Con foto
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-af-ink">
            {conFoto}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar reseñas">
        {tabs.map((tab) => {
          const activa = filtro === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltro(tab.id)}
              aria-pressed={activa}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors af-pulsar ${
                activa
                  ? 'bg-af-ink text-af-ground'
                  : 'bg-af-surface text-af-ink-secondary hover:text-af-ink'
              }`}
            >
              {tab.texto} <span className="tabular-nums opacity-70">({tab.cantidad})</span>
            </button>
          );
        })}
      </div>

      {cargando ? (
        <div className="space-y-3" aria-hidden="true">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-[20px] bg-af-surface p-5">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-af-ground" />
                <span className="h-3 w-40 rounded-full bg-af-ground" />
              </div>
              <span className="mt-5 block h-3 w-2/3 rounded-full bg-af-ground" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-af-surface px-6 py-10 text-center">
          <p className="text-base font-semibold text-af-ink">{error}</p>
          <button
            type="button"
            onClick={cargar}
            className="mt-4 rounded-xl bg-af-ink px-4 py-2.5 text-sm font-semibold text-af-ground af-pulsar"
          >
            Reintentar
          </button>
        </div>
      ) : visibles.length === 0 ? (
        <div className="rounded-2xl bg-af-surface px-6 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-af-ground text-af-ink-secondary">
            <MessageSquare size={22} />
          </span>
          <p className="mt-3 text-base font-semibold text-af-ink">
            {filtro === 'pendientes'
              ? 'No hay reseñas por revisar'
              : filtro === 'publicadas'
                ? 'Todavía no has publicado reseñas'
                : 'Aún no hay reseñas'}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-af-ink-secondary">
            {filtro === 'pendientes'
              ? 'Cuando un comensal califique, aparecerá aquí para que decidas si se publica.'
              : 'Las reseñas aprobadas se muestran en la ficha pública del restaurante.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visibles.map((resena) => {
            const autor = nombreCliente(resena);
            const plato = resena.platillo_id
              ? nombresPlatos.get(resena.platillo_id)
              : null;
            const publica = esPublica(resena);
            const procesando = procesandoId === resena.id;

            return (
              <li key={resena.id} className="rounded-[20px] bg-af-surface p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <Avatar nombre={autor} tamano={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-af-ink">
                      {autor}
                    </p>
                    <p className="mt-0.5 text-xs text-af-ink-secondary">
                      {fechaResena(resena.created_at) || 'Hace poco'}
                      {plato ? ` · Sobre ${plato}` : ' · Sobre el restaurante'}
                    </p>
                  </div>
                  <Estrellas
                    valor={resena.calificacion}
                    tamano={14}
                    className="shrink-0 text-af-accent-text"
                  />
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      publica
                        ? 'bg-af-success/15 text-af-success'
                        : 'bg-af-accent/10 text-af-accent-text'
                    }`}
                  >
                    {publica ? 'Publicada' : 'Pendiente'}
                  </span>
                </div>

                <div className="mt-4 flex gap-3">
                  {resena.foto_url && (
                    <a
                      href={resena.foto_url}
                      target="_blank"
                      rel="noreferrer"
                      title="Abrir la foto de la reseña"
                      className="group relative block h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-af/20 af-pulsar"
                    >
                      <img
                        src={resena.foto_url}
                        alt="Foto de la reseña"
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-md bg-black/55 text-white">
                        <ImageIcon size={12} />
                      </span>
                    </a>
                  )}
                  <p className="min-w-0 whitespace-pre-line text-sm leading-relaxed text-af-ink">
                    {resena.comentario?.trim() || 'Calificó sin dejar comentario.'}
                  </p>
                </div>

                {respondiendoId === resena.id ? (
                  <div className="mt-4 rounded-xl bg-af-ground p-3.5">
                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-af-ink-secondary">
                        Tu respuesta pública
                      </span>
                      <textarea
                        value={borradorRespuesta}
                        onChange={(evento) => {
                          setBorradorRespuesta(evento.target.value);
                          if (errorRespuesta) setErrorRespuesta(null);
                        }}
                        maxLength={MAX_RESPUESTA}
                        rows={3}
                        autoFocus
                        placeholder="Gracias por venir. Nos alegra que…"
                        className="mt-1.5 w-full resize-y rounded-lg border border-af/30 bg-af-surface px-3 py-2 text-sm leading-relaxed text-af-ink outline-none placeholder:text-af-ink-secondary focus:border-af-accent-text focus:ring-2 focus:ring-af-accent/25"
                      />
                    </label>

                    {errorRespuesta && (
                      <p role="alert" className="mt-1 text-xs font-medium text-af-danger-text">
                        {errorRespuesta}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-[11px] tabular-nums text-af-ink-secondary">
                        {borradorRespuesta.length}/{MAX_RESPUESTA}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={cerrarRespuesta}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-af-ink-secondary transition-colors hover:text-af-ink af-pulsar"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => guardarRespuesta(resena)}
                          disabled={guardandoRespuesta === resena.id}
                          className="rounded-lg bg-af-accent-solid px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 af-pulsar"
                        >
                          {guardandoRespuesta === resena.id ? 'Guardando…' : 'Guardar respuesta'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : tieneRespuesta(resena) ? (
                  <div className="mt-4 rounded-xl bg-af-ground px-3.5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-af-ink-secondary">
                        <Store size={13} /> Respuesta del restaurante
                      </p>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => abrirRespuesta(resena)}
                          className="text-[11px] font-semibold text-af-accent-text hover:underline af-pulsar"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => quitarRespuesta(resena)}
                          disabled={guardandoRespuesta === resena.id}
                          className="text-[11px] font-semibold text-af-danger-text hover:underline disabled:opacity-50 af-pulsar"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-af-ink">
                      {resena.respuesta_dueno}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => abrirRespuesta(resena)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-af-ink-secondary transition-colors hover:bg-af-ink/5 hover:text-af-ink af-pulsar"
                  >
                    <MessageSquareQuote size={15} />
                    Responder públicamente
                  </button>
                )}

                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-af/15 pt-4">
                  {publica ? (
                    <button
                      type="button"
                      onClick={() => moderar(resena, false)}
                      disabled={procesando}
                      className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-af-danger-text transition-colors hover:bg-af-danger/10 disabled:opacity-50 af-pulsar"
                    >
                      <EyeOff size={15} />
                      {procesando ? 'Ocultando…' : 'Ocultar'}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => moderar(resena, false)}
                        disabled={procesando}
                        className="rounded-xl px-3.5 py-2 text-xs font-semibold text-af-ink-secondary transition-colors hover:text-af-ink disabled:opacity-50 af-pulsar"
                      >
                        Mantener oculta
                      </button>
                      <button
                        type="button"
                        onClick={() => moderar(resena, true)}
                        disabled={procesando}
                        className="inline-flex items-center gap-2 rounded-xl bg-af-accent-solid px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 af-pulsar"
                      >
                        <Check size={15} />
                        {procesando ? 'Publicando…' : 'Publicar'}
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
