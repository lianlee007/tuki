import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Info, Sparkles } from 'lucide-react';
import { SEO } from '../componentes/ui';
import { BarraInspiracion } from '../componentes/inspiracion/BarraInspiracion';
import { BarajaInspiracion } from '../componentes/inspiracion/BarajaInspiracion';
import { ControlesBaraja } from '../componentes/inspiracion/ControlesBaraja';
import { FiltrosInspiracion } from '../componentes/inspiracion/FiltrosInspiracion';
import { PanelEnVivo } from '../componentes/inspiracion/PanelEnVivo';
import {
  RANGOS_PRECIO,
  esClaveDieta,
  type ClaveDieta,
  type ClavePrecio,
} from '../componentes/descubrir/filtros';
import { ETIQUETA } from '../componentes/descubrir/estilos';
import { apiDescubrir } from '../api/apiDescubrir';
import { useFavoritos } from '../hooks/useFavoritos';
import { useHaptics } from '../hooks/useHaptics';
import { useBaraja, type DecisionBaraja } from '../hooks/useBaraja';
import { formatearPrecio, generarSlug } from '../lib/utils';
import type { PlatoDescubierto, TipoCocina } from '../tipos/modelos';

const LIMITE_BARAJA = 40;

/** Baraja de Fisher-Yates: cada visita propone un orden distinto. */
function mezclar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let indice = copia.length - 1; indice > 0; indice -= 1) {
    const destino = Math.floor(Math.random() * (indice + 1));
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
  }
  return copia;
}

type Aviso = { texto: string; tipo: 'ok' | 'info' };

/**
 * Inspiración: la baraja de platos.
 *
 * El feed responde a «¿qué busco?»; esta página responde a «decide por mí».
 * Un plato a la vez, con la foto como protagonista y dos gestos: derecha para
 * guardar, izquierda para pasar. En escritorio, los filtros y la lista de
 * aprobados ocupan las columnas laterales; en móvil, la baraja manda y la lista
 * se lee justo debajo, sin esconderla en otra pantalla.
 */
const PaginaInspiracion = () => {
  const [cocinas, setCocinas] = useState<TipoCocina[]>([]);
  const [cocina, setCocina] = useState('');
  const [precio, setPrecio] = useState<ClavePrecio | ''>('');
  const [dietas, setDietas] = useState<ClaveDieta[]>([]);

  const [platos, setPlatos] = useState<PlatoDescubierto[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);

  const [aprobados, setAprobados] = useState<PlatoDescubierto[]>([]);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  /** La pista de gestos se retira en cuanto la persona toca la primera carta. */
  const [pistaVisible, setPistaVisible] = useState(true);

  const { esFavorito, alternar } = useFavoritos();
  const { vibrate } = useHaptics();

  const avisar = useCallback((texto: string, tipo: Aviso['tipo'] = 'ok') => {
    setAviso({ texto, tipo });
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(null), 2400);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  useEffect(() => {
    let vigente = true;
    apiDescubrir.cocinas().then(({ cocinas: encontradas }) => {
      if (vigente) setCocinas(encontradas);
    });
    return () => {
      vigente = false;
    };
  }, []);

  const alAprobar = useCallback(
    (plato: PlatoDescubierto, yaEraFavorito: boolean) => {
      if (!yaEraFavorito) alternar(plato.id);
      setAprobados((previos) =>
        previos.some((guardado) => guardado.id === plato.id)
          ? previos
          : [plato, ...previos]
      );
      avisar(`«${plato.nombre}» está en tu inspiración`);
      vibrate([8, 22, 8]);
    },
    [alternar, avisar, vibrate]
  );

  const alDescartar = useCallback(
    (plato: PlatoDescubierto) => {
      avisar(`«${plato.nombre}» quedó para después`, 'info');
      vibrate(6);
    },
    [avisar, vibrate]
  );

  const alDeshacer = useCallback(
    (decision: DecisionBaraja) => {
      if (decision.direccion === 'derecha') {
        setAprobados((previos) =>
          previos.filter((guardado) => guardado.id !== decision.plato.id)
        );
        if (!decision.yaEraFavorito) alternar(decision.plato.id);
      }
      avisar('Deshecho el último gesto', 'info');
    },
    [alternar, avisar]
  );

  const { baraja, salida, puedeDeshacer, repartir, decidir, deshacer } = useBaraja({
    esFavorito,
    alAprobar,
    alDescartar,
    alDeshacer,
  });

  const claveDietas = dietas.join(',');
  const dietasActivas = useMemo(
    () => claveDietas.split(',').filter(esClaveDieta),
    [claveDietas]
  );

  useEffect(() => {
    let vigente = true;
    const rango = precio ? RANGOS_PRECIO[precio] : null;

    setCargando(true);
    setError(null);

    apiDescubrir
      .buscar({
        cocina,
        precioMin: rango?.min,
        precioMax: rango?.max,
        vegetariano: dietasActivas.includes('vegetariano') || undefined,
        vegano: dietasActivas.includes('vegano') || undefined,
        picante: dietasActivas.includes('picante') || undefined,
        limite: LIMITE_BARAJA,
        desde: 0,
      })
      .then(({ platos: encontrados, error: fallo }) => {
        if (!vigente) return;

        if (fallo) {
          setError('No pudimos traer los platos. Revisa tu conexión e inténtalo de nuevo.');
          setPlatos([]);
          setTotal(0);
          repartir([]);
        } else {
          setPlatos(encontrados);
          setTotal(encontrados[0]?.total ?? 0);
          repartir(mezclar(encontrados));
        }
        setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [cocina, precio, dietasActivas, recarga, repartir]);

  const hayFiltros = Boolean(cocina) || precio !== '' || dietas.length > 0;

  const alternarDieta = (dieta: ClaveDieta) => {
    setDietas((previas) =>
      previas.includes(dieta)
        ? previas.filter((clave) => clave !== dieta)
        : [...previas, dieta]
    );
  };

  const limpiarFiltros = () => {
    setCocina('');
    setPrecio('');
    setDietas([]);
  };

  const reiniciarBaraja = useCallback(() => {
    repartir(mezclar(platos));
    avisar('La baraja volvió a repartirse', 'info');
  }, [avisar, platos, repartir]);

  const reintentar = () => setRecarga((valor) => valor + 1);

  const activo = baraja[0] ?? null;
  const destinoMenu = activo
    ? `/restaurante/${generarSlug(activo.restaurante_nombre)}?plato=${activo.id}`
    : null;

  const antojarActivo = () => {
    if (!activo) return;
    setPistaVisible(false);
    decidir(activo, 'derecha');
  };

  const pasarActivo = () => {
    if (!activo) return;
    setPistaVisible(false);
    decidir(activo, 'izquierda');
  };

  const decidirDesdeTarjeta = useCallback(
    (plato: PlatoDescubierto, direccion: DecisionBaraja['direccion']) => {
      setPistaVisible(false);
      decidir(plato, direccion);
    },
    [decidir]
  );

  const quitarAprobado = (plato: PlatoDescubierto) => {
    setAprobados((previos) => previos.filter((guardado) => guardado.id !== plato.id));
    if (esFavorito(plato.id)) alternar(plato.id);
    avisar(`«${plato.nombre}» salió de tu inspiración`, 'info');
  };

  const vaciarAprobados = () => {
    if (aprobados.length === 0) return;
    aprobados.forEach((plato) => {
      if (esFavorito(plato.id)) alternar(plato.id);
    });
    setAprobados([]);
    avisar('Tu lista de antojos quedó vacía', 'info');
  };

  return (
    <div className="min-h-screen bg-hearth-cream font-jakarta text-hearth-espresso transition-colors dark:bg-hearth-night dark:text-hearth-night-ink">
      <SEO
        titulo="Inspiración — TukiTuki"
        descripcion="Desliza platos uno a uno: a la derecha para guardarlos en tus favoritos, a la izquierda para pasar. Descubre qué comer sin decidir a ciegas."
      />

      <BarraInspiracion cantidadAntojos={aprobados.length} />

      <main className="mx-auto w-full max-w-[1280px] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pt-5 lg:px-8 lg:pb-16">
        <div className="mb-3 flex items-end justify-between gap-3 lg:mb-5">
          <div className="min-w-0">
            <p className={`${ETIQUETA} hidden items-center gap-1.5 text-hearth-terracotta-ink lg:flex dark:text-hearth-night-terracotta-ink`}>
              <Sparkles size={12} aria-hidden="true" />
              Inspiración al paso
            </p>
            <h2 className="font-jakarta text-[22px] font-extrabold leading-tight tracking-[-0.03em] text-hearth-espresso sm:text-[clamp(1.55rem,3.6vw,2.05rem)] dark:text-hearth-night-ink">
              ¿Qué se te antoja hoy?
            </h2>
            <p className="mt-0.5 hidden max-w-xl text-[13px] leading-relaxed text-hearth-pebble sm:block dark:text-hearth-night-pebble">
              Desliza a la derecha para guardar el plato y a la izquierda para
              dejarlo pasar.
            </p>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-hearth-card px-3 py-1.5 text-[11px] font-bold text-hearth-pebble ring-1 ring-hearth-line/70 dark:bg-hearth-night-card dark:text-hearth-night-pebble dark:ring-hearth-night-line">
            {cargando ? (
              'Repartiendo…'
            ) : (
              <>
                <span className="tabular-nums text-hearth-espresso dark:text-hearth-night-ink">
                  {baraja.length}
                </span>
                {baraja.length === 1 ? 'carta' : 'cartas'}
              </>
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-7">
          {/* Columna izquierda: filtros fijos en escritorio. */}
          <aside className="hidden lg:col-span-3 lg:block" aria-label="Filtros de inspiración">
            <div className="lg:sticky lg:top-24">
              <FiltrosInspiracion
                cocinas={cocinas}
                cocina={cocina}
                precio={precio}
                dietas={dietas}
                total={total}
                cargando={cargando}
                onCocina={setCocina}
                onPrecio={setPrecio}
                onDieta={alternarDieta}
                onLimpiar={limpiarFiltros}
              />
            </div>
          </aside>

          {/* Columna central: la baraja. */}
          <section className="min-w-0 lg:col-span-6" aria-label="Baraja de platos">
            <div className="mb-3 lg:hidden">
              <FiltrosInspiracion
                compacto
                cocinas={cocinas}
                cocina={cocina}
                precio={precio}
                dietas={dietas}
                total={total}
                cargando={cargando}
                onCocina={setCocina}
                onPrecio={setPrecio}
                onDieta={alternarDieta}
                onLimpiar={limpiarFiltros}
              />
            </div>

            <BarajaInspiracion
              platos={baraja}
              salida={salida}
              cargando={cargando}
              error={error}
              total={total}
              hayFiltros={hayFiltros}
              onDecidir={decidirDesdeTarjeta}
              onInteractuar={() => setPistaVisible(false)}
              onReintentar={reintentar}
              onReiniciar={reiniciarBaraja}
              onLimpiar={limpiarFiltros}
            />

            {pistaVisible && !cargando && baraja.length > 0 && (
              <p
                aria-hidden="true"
                className="mt-2.5 flex items-center justify-center gap-3 text-[11px] font-bold text-hearth-pebble lg:hidden dark:text-hearth-night-pebble"
              >
                <span className="inline-flex items-center gap-1">
                  <ArrowLeft size={13} aria-hidden="true" />
                  Pasar
                </span>
                <span className="font-semibold text-hearth-line dark:text-hearth-night-line">
                  desliza la tarjeta
                </span>
                <span className="inline-flex items-center gap-1 text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink">
                  Guardar
                  <ArrowRight size={13} aria-hidden="true" />
                </span>
              </p>
            )}

            <ControlesBaraja
              puedeDeshacer={puedeDeshacer && !cargando}
              hayActivo={Boolean(activo) && !cargando}
              destinoMenu={cargando ? null : destinoMenu}
              onDeshacer={deshacer}
              onPasar={pasarActivo}
              onAntojar={antojarActivo}
            />

            <p className="mt-3 hidden text-center text-[11px] leading-relaxed text-hearth-pebble lg:block dark:text-hearth-night-pebble">
              También puedes usar las flechas{' '}
              <kbd className="rounded-md bg-hearth-oat px-1.5 py-0.5 font-jakarta text-[10px] font-bold text-hearth-espresso dark:bg-hearth-night-oat dark:text-hearth-night-ink">
                ←
              </kbd>{' '}
              y{' '}
              <kbd className="rounded-md bg-hearth-oat px-1.5 py-0.5 font-jakarta text-[10px] font-bold text-hearth-espresso dark:bg-hearth-night-oat dark:text-hearth-night-ink">
                →
              </kbd>{' '}
              cuando la tarjeta tiene el foco.
            </p>
          </section>

          {/* Columna derecha: lo aprobado, en vivo. */}
          <aside className="lg:col-span-3" aria-label="Inspiración en vivo">
            <div className="lg:sticky lg:top-24">
              <PanelEnVivo
                aprobados={aprobados}
                onQuitar={quitarAprobado}
                onVaciar={vaciarAprobados}
              />
              <p className="mt-3 px-1 text-[10.5px] leading-relaxed text-hearth-pebble dark:text-hearth-night-pebble">
                Tus antojos se guardan en este navegador como favoritos y puedes
                abrir el menú de cada restaurante desde la lista.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Aviso breve: confirma el gesto sin tapar la baraja. */}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-4 transition-all duration-300 ${
          aviso ? 'bottom-6 opacity-100 lg:bottom-8' : 'bottom-4 translate-y-2 opacity-0'
        }`}
      >
        <div className="flex max-w-sm items-center gap-2.5 rounded-2xl bg-hearth-espresso px-4 py-3 text-[12px] font-bold text-hearth-cream shadow-warm-xl dark:bg-hearth-night-card dark:text-hearth-night-ink dark:ring-1 dark:ring-white/10">
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              aviso?.tipo === 'ok'
                ? 'bg-hearth-terracotta text-white dark:bg-hearth-night-terracotta dark:text-hearth-night'
                : 'bg-hearth-oat text-hearth-espresso dark:bg-hearth-night-oat dark:text-hearth-night-ink'
            }`}
          >
            {aviso?.tipo === 'ok' ? (
              <Check size={12} aria-hidden="true" />
            ) : (
              <Info size={12} aria-hidden="true" />
            )}
          </span>
          <span className="min-w-0">{aviso?.texto}</span>
        </div>
      </div>

      {/* El precio formateado también se usa en la baraja; aquí deja una
          referencia accesible del último plato activo para lectores de pantalla. */}
      <p className="sr-only" aria-live="polite">
        {activo
          ? `${activo.nombre}, de ${activo.restaurante_nombre}, cuesta ${formatearPrecio(activo.precio)} pesos.`
          : 'No quedan tarjetas en la baraja.'}
      </p>
    </div>
  );
};

export default PaginaInspiracion;
