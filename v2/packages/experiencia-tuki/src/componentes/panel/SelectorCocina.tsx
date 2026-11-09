import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { iconoCocina } from '../descubrir/iconosCocina';
import type { TipoCocina } from '../../tipos/modelos';
import { apis, aTipoCocina, intentar } from '../../lib/api-tuki';

interface SelectorCocinaProps {
  restauranteId: string;
  /** Avisa al formulario si hay cocinas sin guardar, para el indicador de cambios. */
  onCambios?: (hayCambios: boolean) => void;
  /** Nombres de las cocinas elegidas, para que la IA escriba con ese contexto. */
  onSeleccion?: (nombres: string[]) => void;
}

export interface SelectorCocinaRef {
  /** Guarda las cocinas elegidas. Lo llama el botón "Finalizar y guardar" del formulario. */
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
 * formulario al pulsar "Finalizar y guardar", para que el dueño tenga un solo punto de
 * guardado y no se le queden datos a medias.
 */
export const SelectorCocina = forwardRef<SelectorCocinaRef, SelectorCocinaProps>(
  ({ restauranteId, onCambios, onSeleccion }, ref) => {
    const [cocinas, setCocinas] = useState<TipoCocina[]>([]);
    const [principal, setPrincipal] = useState('');
    const [secundarias, setSecundarias] = useState<string[]>([]);
    const [original, setOriginal] = useState({ principal: '', secundarias: [] as string[] });
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
      let vigente = true;

      const cargar = async () => {
        setCargando(true);
        const [catalogo, panel] = await Promise.all([
          intentar(() => apis.restaurantes.cocinas()),
          intentar(() => apis.restaurantes.panel(restauranteId)),
        ]);

        if (!vigente) return;

        const lista = (catalogo.data?.cocinas ?? []).map(aTipoCocina);
        const asignadas = panel.data?.cocinas ?? [];
        const principalSlug = asignadas[0]?.slug ?? '';
        const secundariasSlugs = asignadas.slice(1).map((cocina) => cocina.slug);

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

    /* Comparte los nombres (no los slugs) de lo elegido: el formulario los usa
       para redactar el eslogan y la descripción con la cocina correcta. */
    useEffect(() => {
      if (!cocinas.length) return;
      const nombres = [principal, ...secundarias]
        .map((slug) => cocinas.find((cocina) => cocina.slug === slug)?.nombre)
        .filter((nombre): nombre is string => Boolean(nombre));
      onSeleccion?.(nombres);
    }, [principal, secundarias, cocinas, onSeleccion]);

    const alternarSecundaria = (slug: string) => {
      setSecundarias((previas) => {
        if (previas.includes(slug)) return previas.filter((actual) => actual !== slug);
        if (previas.length >= MAX_SECUNDARIAS) return previas;
        return [...previas, slug];
      });
    };

    const guardar = useCallback(async () => {
      if (!principal || !sucio) return;

      const { error } = await intentar(() =>
        apis.restaurantes.actualizarCocinas(restauranteId, [principal, ...secundarias]),
      );

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
        <div id="campo-cocina">
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
            «Finalizar y guardar».
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
