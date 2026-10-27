import React, { useEffect, useState } from 'react';
// @ts-ignore — react-router-dom no publica tipos en este proyecto.
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, Loader2, Send, X } from 'lucide-react';
import { Estrellas } from '../sistema-diseno/Estrellas';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { apiResenas } from '../../api/apiResenas';
import {
  MAX_COMENTARIO,
  MAX_NOMBRE,
  validarResena,
} from '../../lib/resenas';
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
 * La reseña entra con `aprobado: false`: el mensaje de éxito dice exactamente
 * eso, sin prometer que ya se publicó.
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
  const platosResenables = platillos.filter(
    (platillo) => platillo.disponible !== false && platillo.visible !== false
  );

  const [calificacion, setCalificacion] = useState(0);
  const [platilloId, setPlatilloId] = useState(platilloInicialId || '');
  const [nombre, setNombre] = useState(nombreInicial);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviada, setEnviada] = useState(false);

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
    return (
      <div className="rounded-[22px] bg-af-surface p-6 sm:p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-af-success/15 text-af-success">
          <Check size={24} strokeWidth={2.6} />
        </span>
        <h3 className="mt-4 text-lg font-bold text-af-ink">Gracias por contarlo</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-af-ink-secondary">
          Tu reseña queda pendiente de aprobación. El restaurante la revisa y,
          cuando la publique, aparecerá aquí con tu nombre.
        </p>
        <button
          type="button"
          onClick={onCancelar}
          className="mt-5 rounded-xl bg-af-ink px-5 py-2.5 text-sm font-semibold text-af-ground af-pulsar"
        >
          Cerrar
        </button>
      </div>
    );
  }

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
      const { error: errorApi } = await apiResenas.crear({
        restauranteId,
        platilloId: platilloId || null,
        calificacion,
        comentario,
        nombre,
        email: user.email ?? null,
      });

      if (errorApi) throw errorApi;
      setEnviada(true);
      onEnviada();
    } catch (e: any) {
      if (e?.code === '23505') {
        setError('Ya dejaste una reseña para este plato. Gracias por volver.');
      } else {
        setError(
          e?.message ||
            'No pudimos guardar tu reseña. Inténtalo otra vez en un momento.'
        );
      }
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
              {platosResenables.map((platillo) => (
                <option key={platillo.id} value={platillo.id}>
                  {platillo.nombre}
                </option>
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
          Tu reseña se publica después de que el restaurante la revise. Tu correo
          no se muestra.
        </p>
      </div>
    </form>
  );
};
