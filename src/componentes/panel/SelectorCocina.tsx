import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { supabase } from '../../lib/supabase';
import { iconoCocina } from '../descubrir/iconosCocina';
import type { TipoCocina } from '../../tipos/modelos';

interface SelectorCocinaProps {
  restauranteId: string;
  /** Avisa al formulario si hay cocinas sin guardar, para el indicador de cambios. */
  onCambios?: (hayCambios: boolean) => void;
}

export interface SelectorCocinaRef {
  /** Guarda las cocinas elegidas. Lo llama el botón "Finalizar" del formulario. */
  guardar: () => Promise<void>;
  /** Vuelve a lo último guardado, junto con el resto de "Descartar". */
  descartar: () => void;
}

const MAX_SECUNDARIAS = 2;

/**
 * Tipo de cocina del restaurante.
 *
 * Es lo que hace que el negocio aparezca cuando alguien filtra por cafetería o
 * por comida china. No tiene botón propio: se guarda junto con el resto del
 * formulario al pulsar "Finalizar", para que el dueño tenga un solo punto de
 * guardado y no se le queden datos a medias.
 */
export const SelectorCocina = forwardRef<SelectorCocinaRef, SelectorCocinaProps>(
  ({ restauranteId, onCambios }, ref) => {
    const [cocinas, setCocinas] = useState<TipoCocina[]>([]);
    const [principal, setPrincipal] = useState('');
    const [secundarias, setSecundarias] = useState<string[]>([]);
    const [original, setOriginal] = useState({ principal: '', secundarias: [] as string[] });
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
      let vigente = true;

      const cargar = async () => {
        setCargando(true);
        const [{ data: catalogo }, { data: asignadas }] = await Promise.all([
          supabase
            .from('tipos_cocina')
            .select('id, slug, nombre, icono, orden')
            .eq('activo', true)
            .order('orden'),
          supabase
            .from('restaurantes_cocinas')
            .select('tipo_cocina_id, principal')
            .eq('restaurante_id', restauranteId),
        ]);

        if (!vigente) return;

        const lista = (catalogo || []) as TipoCocina[];
        const porId = new Map(lista.map((cocina) => [cocina.id, cocina.slug]));
        const filas = asignadas || [];
        const principalActual = filas.find((fila) => fila.principal);
        const principalSlug = principalActual ? porId.get(principalActual.tipo_cocina_id) ?? '' : '';
        const secundariasSlugs = filas
          .filter((fila) => !fila.principal)
          .map((fila) => porId.get(fila.tipo_cocina_id))
          .filter((slug): slug is string => Boolean(slug));

        setCocinas(lista);
        setPrincipal(principalSlug);
        setSecundarias(secundariasSlugs);
        setOriginal({ principal: principalSlug, secundarias: secundariasSlugs });
        setCargando(false);
      };

      cargar();

      return () => {
        vigente = false;
      };
    }, [restauranteId]);

    const sucio =
      principal !== original.principal ||
      [...secundarias].sort().join('|') !== [...original.secundarias].sort().join('|');

    useEffect(() => {
      onCambios?.(sucio);
    }, [sucio, onCambios]);

    const alternarSecundaria = (slug: string) => {
      setSecundarias((previas) => {
        if (previas.includes(slug)) return previas.filter((actual) => actual !== slug);
        if (previas.length >= MAX_SECUNDARIAS) return previas;
        return [...previas, slug];
      });
    };

    const guardar = useCallback(async () => {
      if (!principal || !sucio) return;
      const porSlug = new Map(cocinas.map((cocina) => [cocina.slug, cocina.id]));
      const ids = [principal, ...secundarias]
        .map((slug) => porSlug.get(slug))
        .filter((id): id is string => Boolean(id));

      const { error } = await supabase.rpc('guardar_cocinas_restaurante', {
        p_restaurante_id: restauranteId,
        p_tipo_cocina_ids: ids,
      });

      if (error) {
        throw new Error('No pudimos guardar el tipo de cocina. Revisa la conexión e inténtalo otra vez.');
      }

      setOriginal({ principal, secundarias });
    }, [principal, secundarias, cocinas, restauranteId, sucio]);

    const descartar = useCallback(() => {
      setPrincipal(original.principal);
      setSecundarias(original.secundarias);
    }, [original]);

    useImperativeHandle(ref, () => ({ guardar, descartar }), [guardar, descartar]);

    if (cargando) {
      return <div className="h-24 animate-pulse rounded-xl bg-af-surface" aria-hidden="true" />;
    }

    return (
      <div className="space-y-5">
        <div>
          <label htmlFor="cocina-principal" className="mb-2 block text-sm font-medium text-af-ink">
            Cocina principal <span className="text-af-danger">*</span>
          </label>
          <select
            id="cocina-principal"
            value={principal}
            onChange={(evento) => {
              setPrincipal(evento.target.value);
              setSecundarias((previas) => previas.filter((slug) => slug !== evento.target.value));
            }}
            className="h-11 w-full rounded-xl border border-af/60 bg-af-ground px-3 text-sm text-af-ink outline-none transition-colors focus:border-af-accent"
          >
            <option value="">Elige una cocina</option>
            {cocinas.map((cocina) => (
              <option key={cocina.slug} value={cocina.slug}>
                {cocina.nombre}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-af-ink-secondary">
            Es la que aparece en tu tarjeta y con la que te encuentran al filtrar. Se guarda con
            «Finalizar».
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-af-ink">
            También sirve{' '}
            <span className="font-normal text-af-ink-secondary">(hasta {MAX_SECUNDARIAS})</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {cocinas
              .filter((cocina) => cocina.slug !== principal)
              .map((cocina) => {
                const activa = secundarias.includes(cocina.slug);
                const lleno = secundarias.length >= MAX_SECUNDARIAS;
                const Icono = iconoCocina(cocina.icono);
                return (
                  <button
                    key={cocina.slug}
                    type="button"
                    onClick={() => alternarSecundaria(cocina.slug)}
                    aria-pressed={activa}
                    disabled={!activa && lleno}
                    className={`af-pulsar inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      activa
                        ? 'bg-af-ink text-af-ground'
                        : 'bg-af-surface text-af-ink-secondary hover:text-af-ink'
                    }`}
                  >
                    <Icono size={14} aria-hidden="true" />
                    {cocina.nombre}
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    );
  },
);

SelectorCocina.displayName = 'SelectorCocina';
