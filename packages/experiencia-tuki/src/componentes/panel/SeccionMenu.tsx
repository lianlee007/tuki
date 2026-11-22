/**
 * Descripción: Gestor de platillos del panel.
 *
 * Cada fila es un botón real que abre el editor, y los controles de estado y
 * borrado son hermanos —no hijos— de ese botón. Así ningún toque puede
 * "colarse" al editor: ese era el fallo de la versión anterior, donde toda la
 * fila era clickable y el botón de estado dejaba propagar el clic.
 */
import React, { useMemo, useState } from 'react';
import { Platillo } from '../../tipos';
import { Boton, BotonTexto } from '../ui';
import { ImagenInteligente } from '../sistema-diseno/ImagenInteligente';
import {
  Plus, Power, Ban, EyeOff, Trash2, Search, X, Star, Pencil, UtensilsCrossed,
} from 'lucide-react';
import {
  EstadoPlatillo, ESTADOS, estadoDe, contarEstados, DefinicionEstado,
} from '../../modulos/menu';
import { formatearPrecio, normalizarTexto, prefiereMenosMovimiento, normalizarListaTexto } from '../../lib/utils';

interface SeccionMenuProps {
  platillos: Platillo[];
  setEditandoPlatillo: (p: Partial<Platillo>) => void;
  cambiarEstadoPlatillo: (p: Platillo, estado: EstadoPlatillo) => void;
  eliminarPlatillo: (id: string) => void;
}

type Filtro = 'todos' | 'agotado' | 'oculto' | 'destacado';

const FILTROS: { id: Filtro; nombre: string }[] = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'agotado', nombre: 'Agotados' },
  { id: 'oculto', nombre: 'Ocultos' },
  { id: 'destacado', nombre: 'Destacados' },
];

const plural = (n: number, singular: string, plural_: string) => `${n} ${n === 1 ? singular : plural_}`;

/* ------------------------------------------------------------------ *
 *  Controles
 * ------------------------------------------------------------------ */

/**
 * Segmento de estado. Un toque fija el estado: nada de ciclos escondidos.
 *
 * El estado activo se pinta con el acento sólido y etiqueta blanca, no con un
 * color semántico: `--af-danger` (#FF453A) no llega a 4.5:1 como texto sobre
 * fondo claro, y el acento sí está garantizado en claro y en oscuro. La
 * posición dentro del segmentado ya distingue los tres estados, así que la
 * información no depende del color.
 */
const BotonEstado: React.FC<{
  definicion: DefinicionEstado;
  activo: boolean;
  onClick: () => void;
}> = ({ definicion, activo, onClick }) => {
  const { id, nombre, descripcion } = definicion;
  const Icono = id === 'disponible' ? Power : id === 'agotado' ? Ban : EyeOff;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      aria-label={`${nombre}: ${descripcion}`}
      title={`${nombre} — ${descripcion}`}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-150 outline-none sm:h-8 sm:w-8 ${
        activo
          ? 'bg-af-accent text-white'
          : 'text-af-ink-secondary hover:bg-af-ink/[0.06] hover:text-af-ink'
      }`}
    >
      <Icono size={15} strokeWidth={2.4} />
    </button>
  );
};

/* ------------------------------------------------------------------ *
 *  Fila
 * ------------------------------------------------------------------ */

const FilaPlatillo: React.FC<{
  platillo: Platillo;
  onEditar: () => void;
  onEstado: (estado: EstadoPlatillo) => void;
  onEliminar: () => void;
}> = ({ platillo, onEditar, onEstado, onEliminar }) => {
  const estado = estadoDe(platillo);
  const ingredientes = normalizarListaTexto(platillo.ingredientes).join(', ');
  const apoyo = ingredientes || platillo.descripcion || 'Sin ingredientes todavía';
  const precio = formatearPrecio(platillo.precio);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-3 rounded-2xl bg-af-surface p-2.5 sm:p-3">
      {/* Abrir el plato: un botón de verdad, no una fila con onClick. */}
      <button
        type="button"
        onClick={onEditar}
        className="group flex min-w-0 basis-full items-center gap-3 rounded-xl p-1 text-left transition-colors duration-150 outline-none hover:bg-af-ink/[0.04] focus-visible:bg-af-ink/[0.04] sm:basis-0 sm:flex-1"
      >
        <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-xl">
          <ImagenInteligente src={platillo.imagen_url} alt="" className="h-full w-full" />
          {!platillo.visible && (
            <span className="absolute inset-0 z-20 flex items-center justify-center bg-af-ink/45">
              <EyeOff size={16} className="text-white" />
            </span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-af-ink">{platillo.nombre || 'Sin nombre'}</span>
            {platillo.destacado && (
              <span title="Destacado en el menú" className="shrink-0 leading-none">
                <Star size={13} className="text-af-accent" fill="currentColor" aria-hidden />
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-xs text-af-ink-secondary">{apoyo}</span>
          <span className="mt-1 block text-xs font-semibold tabular-nums text-af-ink sm:hidden">{precio}</span>
        </span>

        {/* Siempre visible: la fila se puede editar y eso tiene que verse sin
            pasar el ratón por encima (en táctil no hay hover que valga). */}
        <Pencil size={15} className="shrink-0 text-af-ink-secondary transition-colors duration-150 group-hover:text-af-accent group-focus-visible:text-af-accent" aria-hidden />
      </button>

      <span className="hidden w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-af-ink sm:block">{precio}</span>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <div
          role="group"
          aria-label={`Estado de ${platillo.nombre || 'el plato'}`}
          className="flex items-center gap-0.5 rounded-full bg-af-ground p-0.5"
        >
          {ESTADOS.map((definicion) => (
            <BotonEstado
              key={definicion.id}
              definicion={definicion}
              activo={estado === definicion.id}
              onClick={() => onEstado(definicion.id)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onEliminar}
          aria-label={`Eliminar ${platillo.nombre || 'el plato'}`}
          title="Eliminar"
          className="flex h-11 w-11 items-center justify-center rounded-full text-af-ink-secondary transition-colors duration-150 outline-none hover:bg-af-danger/10 hover:text-af-danger sm:h-8 sm:w-8"
        >
          <Trash2 size={16} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ *
 *  Sección
 * ------------------------------------------------------------------ */

export const SeccionMenu: React.FC<SeccionMenuProps> = ({
  platillos, setEditandoPlatillo, cambiarEstadoPlatillo, eliminarPlatillo,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const abrirEditor = (platillo?: Platillo) => {
    setEditandoPlatillo(platillo ? { ...platillo } : {});
    // El panel no desplaza la ventana (`.af-pantalla` la deja clavada): el scroll
    // vive en el contenedor del panel, así que hay que devolver arriba ese.
    const contenedor = document.querySelector<HTMLElement>('[data-panel-scroll]');
    requestAnimationFrame(() => contenedor?.scrollTo({ top: 0, behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth' }));
  };

  const conteo = useMemo(() => contarEstados(platillos), [platillos]);

  const visibles = useMemo(() => {
    const consulta = normalizarTexto(busqueda.trim());
    return platillos.filter((p) => {
      if (filtro !== 'todos' && filtro !== 'destacado' && estadoDe(p) !== filtro) return false;
      if (filtro === 'destacado' && !p.destacado) return false;
      if (!consulta) return true;
      const pajar = normalizarTexto(
        [p.nombre, p.categoria, normalizarListaTexto(p.ingredientes).join(' '), p.descripcion].filter(Boolean).join(' '),
      );
      return pajar.includes(consulta);
    });
  }, [platillos, busqueda, filtro]);

  /** Se conserva el orden de la carta: los platos llegan ya ordenados. */
  const grupos = useMemo(() => {
    const mapa = new Map<string, Platillo[]>();
    for (const p of visibles) {
      const categoria = (p.categoria || '').trim() || 'Sin categoría';
      const lista = mapa.get(categoria);
      if (lista) lista.push(p);
      else mapa.set(categoria, [p]);
    }
    return Array.from(mapa.entries());
  }, [visibles]);

  const resumen = [
    plural(conteo.total, 'plato', 'platos'),
    conteo.agotado > 0 ? plural(conteo.agotado, 'agotado', 'agotados') : null,
    conteo.oculto > 0 ? plural(conteo.oculto, 'oculto', 'ocultos') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="pb-6">
      {/* Cabecera fija: título, recuento, buscador, filtros y "Añadir" se quedan
          arriba; lo único que se desplaza es la lista de platos.
          Tiene que quedarse en su sitio EXACTO, sin dar ni un salto al empezar
          a desplazar: la lista de platos se pinta con el contenedor sin
          relleno superior, así que la barra nace a ras del borde que desplaza
          y se ancla en `top-0` — posición natural y de anclaje coinciden. Antes
          nacía 30-60 px más abajo y se anclaba por encima, de modo que al
          primer giro de rueda subía de golpe (y parecía irse con el scroll).
          El aire de arriba lo pone el propio `pt-*` de la cabecera, así que su
          fondo ya cubre desde el borde y no se ve pasar ninguna fila por
          encima. Los filtros llevan `w-full md:w-auto`: en móvil bajan a su
          propia línea, donde se desplazan en horizontal sin apretar el
          buscador. La banda inferior (`after:`) es el borde de scroll: lo que
          pasa por debajo se desvanece en vez de cortarse a cuchillo. */}
      <header className="sticky top-0 z-20 -mx-4 bg-af-ground/85 px-4 pb-3 pt-3 backdrop-blur-xl after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-4 after:bg-gradient-to-b after:from-af-ground/85 after:to-transparent after:content-[''] md:-mx-8 md:px-8 md:pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-af-ink">Tus platillos</h2>
            <p className="mt-0.5 truncate text-sm tabular-nums text-af-ink-secondary">{resumen}</p>
          </div>
          <Boton
            variante="primario"
            tamanio="mediano"
            icono={<Plus size={18} />}
            onClick={() => abrirEditor()}
            className="shrink-0"
          >
            <span className="hidden sm:inline">Añadir platillo</span>
            <span className="sm:hidden">Añadir</span>
          </Boton>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 md:gap-3">
          <div className="relative order-1 min-w-0 flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-af-ink-secondary" aria-hidden />
            <input
              type="text"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar plato o ingrediente"
              aria-label="Buscar plato o ingrediente"
              className="input-af h-11 !pl-9 !pr-9 text-sm"
            />
            {busqueda !== '' && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                aria-label="Borrar la búsqueda"
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-af-ink-secondary transition-colors duration-150 outline-none hover:bg-af-ink/10 hover:text-af-ink"
              >
                <X size={15} strokeWidth={2.4} />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filtrar platillos"
            className="af-sin-scrollbar order-3 flex w-full shrink-0 items-center gap-0.5 overflow-x-auto rounded-full bg-af-surface p-1 md:order-2 md:w-auto"
          >
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltro(f.id)}
                aria-pressed={filtro === f.id}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-af-accent-text ${
                  filtro === f.id ? 'bg-af-accent text-white' : 'text-af-ink-secondary hover:text-af-ink'
                }`}
              >
                {f.nombre}
              </button>
            ))}
          </div>
        </div>
      </header>

      {platillos.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-af-surface px-6 py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-af-accent/10 text-af-accent">
            <UtensilsCrossed size={26} />
          </span>
          <h3 className="mt-5 text-lg font-bold text-af-ink">Tu carta está vacía</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-af-ink-secondary">
            Añade tu primer plato y aparecerá aquí y en tu menú público. Si escribes el nombre, la IA
            redacta la descripción y los ingredientes por ti.
          </p>
          <div className="mt-6 flex justify-center">
            <Boton variante="primario" icono={<Plus size={18} />} onClick={() => abrirEditor()}>
              Añadir el primer plato
            </Boton>
          </div>
        </div>
      ) : grupos.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-af-surface px-6 py-12 text-center">
          <h3 className="text-base font-bold text-af-ink">Sin resultados</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-af-ink-secondary">
            {busqueda.trim()
              ? <>Ningún plato coincide con «{busqueda.trim()}».</>
              : 'Ningún plato está en ese estado ahora mismo.'}
          </p>
          <div className="mt-5 flex justify-center">
            <BotonTexto onClick={() => { setBusqueda(''); setFiltro('todos'); }}>Limpiar los filtros</BotonTexto>
          </div>
        </div>
      ) : (
        <div className="mt-7 space-y-8">
          {grupos.map(([categoria, items]) => (
            <section key={categoria}>
              <div className="mb-3 flex items-baseline gap-2">
                <h3 className="text-base font-semibold text-af-ink">{categoria}</h3>
                <span className="text-xs tabular-nums text-af-ink-secondary">
                  {plural(items.length, 'plato', 'platos')}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((p) => (
                  <FilaPlatillo
                    key={p.id}
                    platillo={p}
                    onEditar={() => abrirEditor(p)}
                    onEstado={(estado) => cambiarEstadoPlatillo(p, estado)}
                    onEliminar={() => eliminarPlatillo(p.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
