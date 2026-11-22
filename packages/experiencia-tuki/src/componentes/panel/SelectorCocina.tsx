import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ChevronDown, Plus, Search, UtensilsCrossed, X } from 'lucide-react';
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
    const [pickerAbierto, setPickerAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const pickerRef = useRef<HTMLDivElement>(null);

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

    /* El selector de adicionales se cierra al hacer clic fuera o con Escape,
       como cualquier capa flotante. */
    useEffect(() => {
      if (!pickerAbierto) return;
      const cerrarFuera = (evento: MouseEvent) => {
        if (!pickerRef.current?.contains(evento.target as Node)) setPickerAbierto(false);
      };
      const cerrarEscape = (evento: KeyboardEvent) => {
        if (evento.key === 'Escape') setPickerAbierto(false);
      };
      document.addEventListener('mousedown', cerrarFuera);
      document.addEventListener('keydown', cerrarEscape);
      return () => {
        document.removeEventListener('mousedown', cerrarFuera);
        document.removeEventListener('keydown', cerrarEscape);
      };
    }, [pickerAbierto]);

    const principalCocina = cocinas.find((cocina) => cocina.slug === principal);
    const IconoPrincipal = principalCocina ? iconoCocina(principalCocina.icono) : UtensilsCrossed;
    const lleno = secundarias.length >= MAX_SECUNDARIAS;
    const disponibles = cocinas.filter(
      (cocina) =>
        cocina.slug !== principal &&
        !secundarias.includes(cocina.slug) &&
        cocina.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
    );

    const elegirPrincipal = (slug: string) => {
      setPrincipal(slug);
      // La principal no puede repetirse entre las adicionales.
      setSecundarias((previas) => previas.filter((actual) => actual !== slug));
    };

    const anadirSecundaria = (slug: string) => {
      if (lleno || slug === principal) return;
      setSecundarias((previas) => (previas.includes(slug) ? previas : [...previas, slug]));
      setBusqueda('');
      // Al llegar al máximo se cierra: no queda nada más que elegir.
      if (secundarias.length + 1 >= MAX_SECUNDARIAS) setPickerAbierto(false);
    };

    const guardar = useCallback(async () => {
      if (!principal || !sucio) return;

      /* Una sola fuente de verdad: la principal primero y, después, las
         adicionales sin repetirla y como mucho dos. */
      const lista = [principal, ...secundarias.filter((slug) => slug !== principal)]
        .filter(Boolean)
        .slice(0, 1 + MAX_SECUNDARIAS);

      const { error } = await intentar(() =>
        apis.restaurantes.actualizarCocinas(restauranteId, lista),
      );

      if (error) {
        throw new Error('No pudimos guardar el tipo de cocina. Revisa la conexión e inténtalo otra vez.');
      }

      setOriginal({ principal, secundarias });
    }, [principal, secundarias, restauranteId, sucio]);

    const descartar = useCallback(() => {
      setPrincipal(original.principal);
      setSecundarias(original.secundarias);
    }, [original]);

    useImperativeHandle(ref, () => ({ guardar, descartar }), [guardar, descartar]);

    if (cargando) {
      return <div className="h-24 animate-pulse rounded-xl bg-af-surface" aria-hidden="true" />;
    }

    return (
      <div className="space-y-6">
        {/* Principal: una sola, con su icono y su peso. */}
        <div id="campo-cocina">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <label htmlFor="cocina-principal" className="text-sm font-medium text-af-ink">
              Cocina principal <span className="text-af-danger">*</span>
            </label>
            <span className="text-[11px] font-medium text-af-ink-secondary">La que define tu carta</span>
          </div>

          <div className="relative flex items-center gap-3 rounded-2xl border border-af/20 bg-af-ground py-1 pl-2.5 pr-2 transition-colors focus-within:border-af-accent">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-af-accent/10 text-af-accent-text">
              <IconoPrincipal size={18} aria-hidden="true" />
            </span>
            <select
              id="cocina-principal"
              value={principal}
              onChange={(evento) => elegirPrincipal(evento.target.value)}
              className="h-12 min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-7 text-sm font-semibold text-af-ink outline-none"
            >
              <option value="">Elige una cocina</option>
              {cocinas.map((cocina) => (
                <option key={cocina.slug} value={cocina.slug} className="bg-af-surface text-af-ink">
                  {cocina.nombre}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute right-4 text-af-ink-secondary"
            />
          </div>
          <p className="mt-2 text-xs text-af-ink-secondary">
            Encabeza tu tarjeta y es la que más peso tiene cuando alguien filtra.
          </p>
        </div>

        {/* Adicionales: solo las elegidas y un buscador para añadir. */}
        <div ref={pickerRef} className="border-t border-af/10 pt-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-af-ink">Cocinas adicionales</p>
            <span className={`text-[11px] font-semibold tabular-nums ${lleno ? 'text-af-accent-text' : 'text-af-ink-secondary'}`}>
              {secundarias.length} de {MAX_SECUNDARIAS}
            </span>
          </div>
          <p className="mb-3 text-xs text-af-ink-secondary">
            Hasta dos más. Aparecen como filtros secundarios en tu ficha, nunca como la principal.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {secundarias.map((slug) => {
              const cocina = cocinas.find((actual) => actual.slug === slug);
              if (!cocina) return null;
              const Icono = iconoCocina(cocina.icono);
              return (
                <span
                  key={slug}
                  className="inline-flex items-center gap-1.5 rounded-full bg-af-accent/10 py-1 pl-3 pr-1 text-[13px] font-semibold text-af-accent-text"
                >
                  <Icono size={14} aria-hidden="true" />
                  {cocina.nombre}
                  <button
                    type="button"
                    onClick={() => setSecundarias((previas) => previas.filter((actual) => actual !== slug))}
                    aria-label={`Quitar ${cocina.nombre}`}
                    className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-af-accent/15"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </span>
              );
            })}

            {!lleno && (
              <button
                type="button"
                onClick={() => setPickerAbierto((valor) => !valor)}
                aria-expanded={pickerAbierto}
                aria-controls="picker-cocinas"
                className="af-pulsar inline-flex items-center gap-1.5 rounded-full border border-dashed border-af/40 px-3 py-2 text-[13px] font-semibold text-af-ink-secondary transition-colors hover:border-af-accent/60 hover:text-af-ink"
              >
                <Plus size={15} aria-hidden="true" /> Añadir cocina
              </button>
            )}
          </div>

          {pickerAbierto && (
            <div
              id="picker-cocinas"
              className="mt-3 overflow-hidden rounded-2xl border border-af/20 bg-af-surface shadow-sm"
            >
              <div className="relative border-b border-af/10 p-2">
                <Search
                  size={15}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-af-ink-secondary"
                />
                <input
                  type="search"
                  value={busqueda}
                  onChange={(evento) => setBusqueda(evento.target.value)}
                  placeholder="Buscar cocina"
                  aria-label="Buscar cocina adicional"
                  className="input-af h-10 !pl-9 text-sm"
                />
              </div>
              <ul className="max-h-56 overflow-y-auto overscroll-contain p-1">
                {disponibles.length === 0 ? (
                  <li className="px-3 py-6 text-center text-xs text-af-ink-secondary">
                    No quedan cocinas por añadir.
                  </li>
                ) : (
                  disponibles.map((cocina) => {
                    const Icono = iconoCocina(cocina.icono);
                    return (
                      <li key={cocina.slug}>
                        <button
                          type="button"
                          onClick={() => anadirSecundaria(cocina.slug)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium text-af-ink outline-none transition-colors hover:bg-af-accent/[0.08] focus-visible:bg-af-accent/[0.08]"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-af-accent/10 text-af-accent-text">
                            <Icono size={14} aria-hidden="true" />
                          </span>
                          {cocina.nombre}
                          <Plus size={14} aria-hidden="true" className="ml-auto text-af-ink-secondary" />
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          )}

          {lleno && (
            <p className="mt-2 text-[11px] text-af-ink-secondary">
              Quita una para poder añadir otra.
            </p>
          )}
        </div>
      </div>
    );
  },
);

SelectorCocina.displayName = 'SelectorCocina';
