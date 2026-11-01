import React, { useEffect, useMemo, useRef, useState } from 'react';
// @ts-ignore — react-router-dom no publica tipos en este proyecto.
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Camera, Check, ImagePlus, Loader2, Send, X } from 'lucide-react';
import { Estrellas } from '../sistema-diseno/Estrellas';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { apiResenas, MAX_COMENTARIO, MAX_NOMBRE, validarResena } from '../../modulos/resenas';
import { subirImagen } from '../../lib/servicios';
import { validarFoto } from '../../lib/imagenes';
import type { Platillo } from '../../tipos/modelos';
import type { EstilosComunes } from './PlantillaRestaurante';

interface FormularioResenaProps {
  restauranteId: string;
  platillos: Platillo[];
  platilloInicialId?: string | null;
  estilos: EstilosComunes;
  onEnviada: () => void;
  onCancelar: () => void;
}

/**
 * Formulario de reseña, dentro de la propia ficha.
 *
 * No es un modal: en móvil el teclado y el modal se pelean por la altura, y en
 * escritorio obliga a un salto de foco. Al vivir en la sección de reseñas, el
 * comensal ve la lista mientras escribe y el dueño conserva el mismo contexto.
 *
 * La reseña se publica al enviarla: no hay paso de aprobación del restaurante.
 * Un comensal puede reseñar tantas veces como quiera, el mismo plato o la misma
 * categoría incluidas. El mensaje de éxito lo dice sin ambigüedad.
 */
export const FormularioResena: React.FC<FormularioResenaProps> = ({
  restauranteId,
  platillos,
  platilloInicialId,
  estilos,
  onEnviada,
  onCancelar,
}) => {
  const { user, rol, cargandoRol, cerrarSesion } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const nombreInicial = [user?.user_metadata?.nombre, user?.user_metadata?.apellido]
    .filter(Boolean)
    .join(' ')
    .trim();

  // Un plato agotado u oculto no debería aparecer en el selector de reseña.
  const platosResenables = useMemo(
    () =>
      platillos.filter(
        (platillo) => platillo.disponible !== false && platillo.visible !== false
      ),
    [platillos]
  );

  // El selector se agrupa por categoría para que el comensal encuentre el plato
  // sin recorrer una lista plana. La reseña se puede repetir en cualquier
  // categoría, sin límite.
  const platosPorCategoria = useMemo(() => {
    const grupos = new Map<string, Platillo[]>();
    platosResenables.forEach((platillo) => {
      const categoria = platillo.categoria?.trim() || 'Otros';
      const lista = grupos.get(categoria) ?? [];
      lista.push(platillo);
      grupos.set(categoria, lista);
    });

    return [...grupos.entries()].sort(([a], [b]) =>
      a.localeCompare(b, 'es')
    );
  }, [platosResenables]);

  const inicialValido =
    platilloInicialId &&
    platosResenables.some((platillo) => platillo.id === platilloInicialId)
      ? platilloInicialId
      : '';

  const [calificacion, setCalificacion] = useState(0);
  const [platilloId, setPlatilloId] = useState(inicialValido);
  const [nombre, setNombre] = useState(nombreInicial);
  const [comentario, setComentario] = useState('');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviada, setEnviada] = useState(false);
  const [publicada, setPublicada] = useState(true);
  const selectorFoto = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (nombreInicial && !nombre) setNombre(nombreInicial);
    // Solo rellena al entrar; no pisa lo que el comensal ya escribió.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) {
    return (
      <div className="rounded-[22px] bg-af-surface p-6 sm:p-8 text-center">
        <h3 className="text-lg font-bold text-af-ink">Entra para reseñar</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-af-ink-secondary">
          Las reseñas van firmadas por una cuenta para que el restaurante sepa a
          quién responder. Solo necesitas un correo.
        </p>
        <Link
          to={`/entrar?volver=${encodeURIComponent(location.pathname + location.search)}`}
          className="mt-5 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white af-pulsar"
          style={{ backgroundColor: estilos.primary, color: estilos.onPrimary }}
        >
          Entrar y reseñar
        </Link>
      </div>
    );
  }

  if (cargandoRol) {
    return (
      <div className="rounded-[22px] bg-af-surface px-6 py-10 text-center">
        <p className="text-sm text-af-ink-secondary">Un momento…</p>
      </div>
    );
  }

  if (rol === 'restaurante') {
    return (
      <div className="rounded-[22px] bg-af-surface p-6 sm:p-8 text-center">
        <h3 className="text-lg font-bold text-af-ink">
          Estás en una cuenta de restaurante
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-af-ink-secondary">
          Las reseñas las escriben los comensales. Cambia a tu cuenta de cliente
          para contar cómo estuvo tu pedido.
        </p>
        <button
          type="button"
          onClick={async () => {
            await cerrarSesion();
            navigate(`/entrar?volver=${encodeURIComponent(location.pathname + location.search)}`);
          }}
          className="mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white af-pulsar"
          style={{ backgroundColor: estilos.primary, color: estilos.onPrimary }}
        >
          Cambiar de cuenta
        </button>
      </div>
    );
  }

  if (enviada) {
    const escribirOtra = () => {
      setEnviada(false);
      setCalificacion(0);
      setPlatilloId('');
      setComentario('');
      setFotoUrl(null);
      setError(null);
      setErrorFoto(null);
    };

    return (
      <div className="rounded-[22px] bg-af-surface p-6 sm:p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-af-success/15 text-af-success">
          <Check size={24} strokeWidth={2.6} />
        </span>
        <h3 className="mt-4 text-lg font-bold text-af-ink">Gracias por contarlo</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-af-ink-secondary">
          {publicada
            ? 'Tu reseña ya se publicó. Aparece aquí mismo con tu nombre, junto a las de los demás comensales. Puedes escribir otra cuando quieras: no hay límite por plato ni por categoría.'
            : 'Tu reseña se guardó, pero la base de datos todavía exige aprobación. Aplica la migración de publicación directa para que aparezca en la ficha.'}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-af-ink-secondary transition-colors hover:text-af-ink af-pulsar"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={escribirOtra}
            className="rounded-xl bg-af-ink px-5 py-2.5 text-sm font-semibold text-af-ground af-pulsar"
          >
            Escribir otra reseña
          </button>
        </div>
      </div>
    );
  }

  /**
   * La foto se comprime y sube a Supabase Storage antes de enviar la reseña. Si
   * la subida falla, el formulario no se bloquea: se avisa y se puede publicar
   * solo con texto. La URL resultante es lo único que viaja a Supabase.
   */
  const elegirFoto = async (evento: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0];
    // Permite volver a elegir el mismo archivo después de quitarlo.
    evento.target.value = '';
    if (!archivo) return;

    const fallo = validarFoto(archivo);
    if (fallo) {
      setErrorFoto(fallo);
      return;
    }

    setErrorFoto(null);
    setSubiendoFoto(true);
    try {
      setFotoUrl(await subirImagen(archivo, 'resenas'));
    } catch {
      setErrorFoto(
        'No pudimos subir la foto. Puedes enviar la reseña sin ella y contarlo con palabras.'
      );
    } finally {
      setSubiendoFoto(false);
    }
  };

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    const fallo = validarResena({ calificacion, comentario, nombre });
    if (fallo) {
      setError(fallo);
      return;
    }

    setError(null);
    setEnviando(true);
    try {
      const { error: errorApi, publicada: quedoPublica } = await apiResenas.crear({
        restauranteId,
        platilloId: platilloId || null,
        calificacion,
        comentario,
        nombre,
        email: user.email ?? null,
        fotoUrl,
      });

      if (errorApi) throw errorApi;
      setPublicada(quedoPublica);
      setEnviada(true);
      onEnviada();
    } catch (e: any) {
      setError(
        e?.message ||
          'No pudimos guardar tu reseña. Inténtalo otra vez en un momento.'
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form
      onSubmit={enviar}
      className="rounded-[22px] bg-af-surface p-5 sm:p-7"
      aria-labelledby="titulo-formulario-resena"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 id="titulo-formulario-resena" className="text-lg font-bold text-af-ink">
            Cuéntanos cómo estuvo
          </h3>
          <p className="mt-1 text-sm text-af-ink-secondary">
            Una nota sincera ayuda a quien viene detrás.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancelar}
          aria-label="Cerrar el formulario de reseña"
          className="rounded-full p-2 text-af-ink-secondary transition-colors hover:bg-af-ink/5 hover:text-af-ink af-pulsar"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-6 grid gap-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-af-ink-secondary">
            Tu calificación
          </span>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Estrellas
              valor={calificacion}
              tamano={28}
              onCambiar={setCalificacion}
              className="text-af-accent-text"
            />
            <span className="text-sm font-semibold text-af-ink-secondary">
              {calificacion > 0 ? `${calificacion} de 5` : 'Toca las estrellas'}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-af-ink-secondary">
              ¿Qué pediste?
            </span>
            <select
              value={platilloId}
              onChange={(evento) => setPlatilloId(evento.target.value)}
              className="mt-1.5 w-full rounded-xl border border-af/30 bg-af-ground px-3 py-2.5 text-sm text-af-ink outline-none focus:border-af-accent-text focus:ring-2 focus:ring-af-accent/25"
            >
              <option value="">El restaurante en general</option>
              {platosPorCategoria.map(([categoria, platos]) => (
                <optgroup key={categoria} label={categoria}>
                  {platos.map((platillo) => (
                    <option key={platillo.id} value={platillo.id}>
                      {platillo.nombre}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-af-ink-secondary">
              Tu nombre
            </span>
            <input
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              maxLength={MAX_NOMBRE}
              autoComplete="name"
              placeholder="Como quieres aparecer"
              className="mt-1.5 w-full rounded-xl border border-af/30 bg-af-ground px-3 py-2.5 text-sm text-af-ink outline-none placeholder:text-af-ink-secondary focus:border-af-accent-text focus:ring-2 focus:ring-af-accent/25"
            />
          </label>
        </div>

        <label className="block">
          <span className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-af-ink-secondary">
            <span>Tu experiencia</span>
            <span className="font-normal normal-case tracking-normal tabular-nums">
              {comentario.length}/{MAX_COMENTARIO}
            </span>
          </span>
          <textarea
            value={comentario}
            onChange={(evento) => setComentario(evento.target.value)}
            maxLength={MAX_COMENTARIO}
            rows={4}
            placeholder="¿Qué te gustó? ¿Qué pedirías otra vez?"
            className="mt-1.5 w-full resize-y rounded-xl border border-af/30 bg-af-ground px-3 py-2.5 text-sm leading-relaxed text-af-ink outline-none placeholder:text-af-ink-secondary focus:border-af-accent-text focus:ring-2 focus:ring-af-accent/25"
          />
        </label>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-af-ink-secondary">
            Una foto, si quieres
          </span>

          <div className="mt-2">
            {fotoUrl ? (
              <div className="relative overflow-hidden rounded-2xl border border-af/30 bg-af-ground">
                <img
                  src={fotoUrl}
                  alt="Foto que acompañará tu reseña"
                  className="h-44 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFotoUrl(null)}
                  aria-label="Quitar la foto"
                  className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/75 af-pulsar"
                >
                  <X size={14} /> Quitar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => selectorFoto.current?.click()}
                disabled={subiendoFoto}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-af/40 bg-af-ground px-4 py-6 text-sm font-semibold text-af-ink-secondary transition-colors hover:border-af-accent-text hover:text-af-ink disabled:opacity-60 af-pulsar"
              >
                {subiendoFoto ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Subiendo la foto…
                  </>
                ) : (
                  <>
                    <ImagePlus size={18} /> Añadir una foto del plato
                  </>
                )}
              </button>
            )}
          </div>

          <input
            ref={selectorFoto}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={elegirFoto}
            className="sr-only"
            tabIndex={-1}
          />

          <p className="mt-2 flex items-center gap-1.5 text-xs text-af-ink-secondary">
            <Camera size={13} /> Se optimiza al subir. Tu foto se publica junto
            con la reseña de inmediato.
          </p>

          {errorFoto && (
            <p role="alert" className="mt-1 text-xs font-medium text-af-danger-text">
              {errorFoto}
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-af-danger-text">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-af-ink-secondary transition-colors hover:text-af-ink af-pulsar"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando || calificacion === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 af-pulsar"
            style={{ backgroundColor: estilos.primary, color: estilos.onPrimary }}
          >
            {enviando ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            {enviando ? 'Enviando…' : 'Enviar reseña'}
          </button>
        </div>

        <p className="text-xs leading-relaxed text-af-ink-secondary">
          Tu reseña se publica en cuanto la envías. Puedes escribir todas las
          que quieras del mismo plato o categoría. Tu correo no se muestra.
        </p>
      </div>
    </form>
  );
};
