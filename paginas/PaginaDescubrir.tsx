import React, { useEffect, useMemo, useState } from 'react';
// @ts-ignore
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ShoppingBag, SlidersHorizontal, UtensilsCrossed, X } from 'lucide-react';
import { SEO } from '../componentes/ui';
import { BarraDescubrir } from '../componentes/descubrir/BarraDescubrir';
import { CarrilCocinas } from '../componentes/descubrir/CarrilCocinas';
import { CarrilRestaurantes } from '../componentes/descubrir/CarrilRestaurantes';
import { PanelFiltros } from '../componentes/descubrir/PanelFiltros';
import { PanelCarrito } from '../componentes/descubrir/PanelCarrito';
import { AvisoCuenta, AvisoOtroRestaurante } from '../componentes/descubrir/AvisosDescubrir';
import { TarjetaPlato } from '../componentes/descubrir/TarjetaPlato';
import {
  DIETAS,
  RANGOS_PRECIO,
  esClaveDieta,
  esClavePrecio,
  type ClaveDieta,
  type ClavePrecio,
} from '../componentes/descubrir/filtros';
import { apiDescubrir } from '../servicios/apiDescubrir';
import { useAuth } from '../contexto/ContextoAutenticacion';
import { useStoreCarrito } from '../store/storeCarrito';
import { formatearPrecio } from '../lib/utils';
import type {
  PlatoDescubierto,
  Platillo,
  RestauranteDescubierto,
  TipoCocina,
} from '../tipos/modelos';

const LIMITE = 24;

/** El carrito guarda `Platillo`; el feed trae una versión más corta. */
const aPlatillo = (plato: PlatoDescubierto): Platillo => ({
  id: plato.id,
  restaurante_id: plato.restaurante_id,
  categoria: plato.categoria ?? '',
  nombre: plato.nombre,
  descripcion: plato.descripcion ?? '',
  precio: plato.precio,
  imagen_url: plato.imagen_url ?? '',
  ingredientes: [],
  alergenos: [],
  vegetariano: plato.vegetariano,
  vegano: plato.vegano,
  picante: plato.picante,
  disponible: true,
  visible: true,
  destacado: false,
});

/** Esqueletos del primer pintado: estáticos, sin pulso que distraiga. */
const Esqueletos: React.FC = () => (
  <div className="mt-6 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
    {Array.from({ length: 6 }).map((_, indice) => (
      <div key={indice}>
        <div className="aspect-[4/3] rounded-[22px] bg-af-surface" />
        <div className="mt-3 h-4 w-3/4 rounded-full bg-af-surface" />
        <div className="mt-2 h-3 w-1/2 rounded-full bg-af-surface" />
      </div>
    ))}
  </div>
);

const PaginaDescubrir = () => {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, rol, cargandoRol, cerrarSesion } = useAuth();

  const carrito = useStoreCarrito((estado) => estado.carrito);
  const cantidadCarrito = carrito.reduce((suma, item) => suma + item.cantidad, 0);
  const totalCarrito = carrito.reduce(
    (suma, item) => suma + item.platillo.precio * item.cantidad,
    0
  );

  const consulta = params.get('q') ?? '';
  const cocina = params.get('cocina') ?? '';
  const precioCrudo = params.get('precio') ?? '';
  const precio: ClavePrecio | '' = esClavePrecio(precioCrudo) ? precioCrudo : '';
  const dietas = useMemo(
    () => (params.get('dietas') ?? '').split(',').filter(esClaveDieta),
    [params]
  );

  const [texto, setTexto] = useState(consulta);
  const [cocinas, setCocinas] = useState<TipoCocina[]>([]);
  const [platos, setPlatos] = useState<PlatoDescubierto[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [reintento, setReintento] = useState(0);

  const [restaurantes, setRestaurantes] = useState<RestauranteDescubierto[]>([]);
  const [totalRestaurantes, setTotalRestaurantes] = useState(0);
  const [cargandoRestaurantes, setCargandoRestaurantes] = useState(true);

  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [cuentaAbierta, setCuentaAbierta] = useState(false);
  const [conflicto, setConflicto] = useState<PlatoDescubierto | null>(null);

  /* La URL manda: atrás y adelante del navegador devuelven el mismo feed. */
  const actualizar = (cambios: Record<string, string | null>) => {
    setParams(
      (previos) => {
        const siguientes = new URLSearchParams(previos);
        Object.entries(cambios).forEach(([clave, valor]) => {
          if (valor === null || valor === '') siguientes.delete(clave);
          else siguientes.set(clave, valor);
        });
        return siguientes;
      },
      { replace: true }
    );
  };

  /* Escribir no dispara una petición por tecla. */
  useEffect(() => {
    if (texto === consulta) return;
    const temporizador = setTimeout(() => actualizar({ q: texto.trim() || null }), 280);
    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, consulta]);

  /* Si la URL cambia por fuera (atrás, enlace), el campo se sincroniza. */
  useEffect(() => {
    setTexto(consulta);
  }, [consulta]);

  useEffect(() => {
    let vigente = true;
    apiDescubrir.cocinas().then(({ cocinas }) => {
      if (vigente) setCocinas(cocinas);
    });
    return () => {
      vigente = false;
    };
  }, []);

  const clave = params.toString();

  useEffect(() => {
    let vigente = true;
    const rango = precio ? RANGOS_PRECIO[precio] : null;

    setCargando(true);
    setError(null);

    apiDescubrir
      .buscar({
        q: consulta,
        cocina,
        precioMin: rango?.min,
        precioMax: rango?.max,
        vegetariano: dietas.includes('vegetariano') || undefined,
        vegano: dietas.includes('vegano') || undefined,
        picante: dietas.includes('picante') || undefined,
        limite: LIMITE,
        desde: 0,
      })
      .then(({ platos: encontrados, error: fallo }) => {
        if (!vigente) return;
        if (fallo) {
          setError('No pudimos cargar los platos. Inténtalo otra vez.');
          setPlatos([]);
          setTotal(0);
        } else {
          setPlatos(encontrados);
          setTotal(encontrados[0]?.total ?? 0);
        }
        setCargando(false);
      });

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, reintento]);

  /*
   * El carril de restaurantes responde al texto y a la cocina, no al precio ni
   * a la dieta: esos filtros son del plato que se va a comer, no del local.
   */
  useEffect(() => {
    let vigente = true;
    setCargandoRestaurantes(true);

    apiDescubrir
      .restaurantes({ q: consulta, cocina, limite: 12 })
      .then(({ restaurantes: encontrados, error: fallo }) => {
        if (!vigente) return;
        if (fallo) {
          setRestaurantes([]);
          setTotalRestaurantes(0);
        } else {
          setRestaurantes(encontrados);
          setTotalRestaurantes(encontrados[0]?.total ?? 0);
        }
        setCargandoRestaurantes(false);
      });

    return () => {
      vigente = false;
    };
  }, [consulta, cocina, reintento]);

  const cargarMas = async () => {
    const rango = precio ? RANGOS_PRECIO[precio] : null;
    setCargandoMas(true);
    const { platos: siguientes, error: fallo } = await apiDescubrir.buscar({
      q: consulta,
      cocina,
      precioMin: rango?.min,
      precioMax: rango?.max,
      vegetariano: dietas.includes('vegetariano') || undefined,
      vegano: dietas.includes('vegano') || undefined,
      picante: dietas.includes('picante') || undefined,
      limite: LIMITE,
      desde: platos.length,
    });
    if (!fallo) setPlatos((previos) => [...previos, ...siguientes]);
    setCargandoMas(false);
  };

  const alternarDieta = (dieta: ClaveDieta) => {
    const siguientes = dietas.includes(dieta)
      ? dietas.filter((actual) => actual !== dieta)
      : [...dietas, dieta];
    actualizar({ dietas: siguientes.join(',') || null });
  };

  const limpiar = () => {
    setTexto('');
    setParams(new URLSearchParams(), { replace: true });
  };

  /**
   * Sumar al carrito es la primera acción que pide cuenta. Quien no ha entrado
   * puede explorar todo; el aviso llega al guardar, no al abrir la página.
   */
  const agregarAlCarrito = (plato: PlatoDescubierto) => {
    if (cargandoRol) return;

    if (rol !== 'cliente') {
      setCuentaAbierta(true);
      return;
    }

    const resultado = useStoreCarrito
      .getState()
      .agregarItem(aPlatillo(plato), plato.restaurante_nombre);

    if (resultado === 'otro-restaurante') setConflicto(plato);
  };

  const confirmarCambioDeRestaurante = () => {
    if (!conflicto) return;
    useStoreCarrito
      .getState()
      .reemplazarCarrito(aPlatillo(conflicto), conflicto.restaurante_nombre);
    setConflicto(null);
  };

  const cambiarACuentaCliente = async () => {
    await cerrarSesion();
    setCuentaAbierta(false);
    navigate('/entrar');
  };

  const filtrosActivos = (cocina ? 1 : 0) + (precio ? 1 : 0) + dietas.length;
  const cocinaElegida = cocinas.find((c) => c.slug === cocina);
  const hayFiltros = filtrosActivos > 0 || consulta.trim().length > 0;
  const primerPintado = cargando && platos.length === 0;
  const volver = `${location.pathname}${location.search}`;

  return (
    <div className="min-h-screen bg-af-ground text-af-ink">
      <SEO
        titulo="Riki — Descubre platos de restaurantes"
        descripcion="Busca platos por cocina, precio y preferencias. Encuentra qué comer y pide directo al restaurante."
      />

      <BarraDescubrir
        consulta={texto}
        onConsulta={setTexto}
        onCarrito={() => setCarritoAbierto(true)}
        cantidadCarrito={cantidadCarrito}
      />

      <main className="mx-auto max-w-6xl px-5 pb-32 pt-8">
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-[1.1] tracking-tight text-af-ink">
          ¿Qué se te antoja?
        </h1>

        <div className="mt-5">
          <CarrilCocinas
            cocinas={cocinas}
            activa={cocina}
            onElegir={(slug) => actualizar({ cocina: slug })}
          />
        </div>

        <CarrilRestaurantes
          restaurantes={restaurantes}
          total={totalRestaurantes}
          cargando={cargandoRestaurantes}
          cocinaCoincidente={cocinaElegida?.nombre ?? null}
        />

        <div className="mt-8 flex items-center justify-between gap-3">
          <p aria-live="polite" className="text-[13px] text-af-ink-secondary">
            {primerPintado
              ? 'Buscando…'
              : error
                ? 'Sin resultados'
                : total === 1
                  ? '1 plato'
                  : `${total.toLocaleString('es-CO')} platos`}
          </p>

          <button
            type="button"
            onClick={() => setFiltrosAbiertos(true)}
            className="af-pulsar flex shrink-0 items-center gap-2 rounded-full bg-af-surface px-4 py-2 text-[13px] font-semibold text-af-ink transition-colors hover:text-af-accent-text"
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            Filtros
            {filtrosActivos > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-af-ink px-1.5 text-[11px] font-bold text-af-ground">
                {filtrosActivos}
              </span>
            )}
          </button>
        </div>

        {hayFiltros && (
          <div className="mt-3 flex flex-wrap gap-2">
            {cocinaElegida && (
              <PastillaActiva
                etiqueta={cocinaElegida.nombre}
                onQuitar={() => actualizar({ cocina: null })}
              />
            )}
            {precio && (
              <PastillaActiva
                etiqueta={RANGOS_PRECIO[precio].etiqueta}
                onQuitar={() => actualizar({ precio: null })}
              />
            )}
            {dietas.map((dieta) => (
              <PastillaActiva
                key={dieta}
                etiqueta={DIETAS.find((opcion) => opcion.clave === dieta)?.etiqueta ?? dieta}
                onQuitar={() => alternarDieta(dieta)}
              />
            ))}
            {consulta.trim() && (
              <PastillaActiva
                etiqueta={`«${consulta.trim()}»`}
                onQuitar={() => {
                  setTexto('');
                  actualizar({ q: null });
                }}
              />
            )}
          </div>
        )}

        {primerPintado ? (
          <Esqueletos />
        ) : error ? (
          <Estado
            titulo="Algo se quemó en la cocina"
            texto={error}
            accion={
              <button
                type="button"
                onClick={() => setReintento((valor) => valor + 1)}
                className="af-pulsar rounded-full bg-af-ink px-5 py-2.5 text-[14px] font-semibold text-af-ground"
              >
                Reintentar
              </button>
            }
          />
        ) : platos.length === 0 ? (
          <Estado
            titulo={hayFiltros ? 'Nada por aquí' : 'Todavía no hay platos'}
            texto={
              hayFiltros
                ? 'Prueba con otra palabra o quita algún filtro.'
                : 'Cuando los restaurantes publiquen su carta, sus platos aparecerán aquí.'
            }
            accion={
              hayFiltros ? (
                <button
                  type="button"
                  onClick={limpiar}
                  className="af-pulsar rounded-full bg-af-ink px-5 py-2.5 text-[14px] font-semibold text-af-ground"
                >
                  Quitar los filtros
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div
              className={`mt-6 grid gap-x-5 gap-y-8 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 ${
                cargando ? 'opacity-60' : 'opacity-100'
              }`}
              aria-busy={cargando}
            >
              {platos.map((plato, indice) => (
                <TarjetaPlato
                  key={plato.id}
                  plato={plato}
                  destacado={indice === 0 && !hayFiltros}
                  onAgregar={agregarAlCarrito}
                />
              ))}
            </div>

            {platos.length < total && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={cargarMas}
                  disabled={cargandoMas}
                  className="af-pulsar rounded-full bg-af-surface px-6 py-3 text-[14px] font-semibold text-af-ink transition-opacity hover:opacity-80 disabled:opacity-60"
                >
                  {cargandoMas ? 'Cargando…' : 'Ver más platos'}
                </button>
              </div>
            )}
          </>
        )}

        <footer className="mt-16 flex flex-col items-center gap-2 pt-8 text-center">
          <p className="text-[14px] text-af-ink-secondary">¿Tienes un restaurante?</p>
          <Link
            to="/para-restaurantes"
            className="af-pulsar inline-flex items-center gap-1.5 text-[15px] font-semibold text-af-ink transition-colors hover:text-af-accent-text"
          >
            Crea tu menú con Riki
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </footer>
      </main>

      {/* La barra del pedido solo existe para un comensal con algo en el carrito. */}
      {rol === 'cliente' && carrito.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setCarritoAbierto(true)}
            className="af-pulsar mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-af-ink px-5 py-3.5 text-af-ground transition-opacity hover:opacity-90"
          >
            <span className="inline-flex items-center gap-2 text-[14px] font-semibold">
              <ShoppingBag size={17} aria-hidden="true" />
              {cantidadCarrito} {cantidadCarrito === 1 ? 'producto' : 'productos'}
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{formatearPrecio(totalCarrito)}</span>
            </span>
            <span className="text-[13px] font-semibold">Ver carrito</span>
          </button>
        </div>
      )}

      <PanelFiltros
        abierto={filtrosAbiertos}
        total={total}
        precio={precio}
        dietas={dietas}
        onPrecio={(nuevo) => actualizar({ precio: nuevo || null })}
        onDieta={alternarDieta}
        onLimpiar={limpiar}
        onCerrar={() => setFiltrosAbiertos(false)}
      />

      <PanelCarrito abierto={carritoAbierto} onCerrar={() => setCarritoAbierto(false)} />

      <AvisoCuenta
        abierto={cuentaAbierta}
        onCerrar={() => setCuentaAbierta(false)}
        volver={volver}
        esRestaurante={Boolean(user) && rol === 'restaurante'}
        onCambiarCuenta={cambiarACuentaCliente}
      />

      <AvisoOtroRestaurante
        abierto={conflicto !== null}
        actual={carrito[0]?.restaurante_nombre}
        nuevo={conflicto?.restaurante_nombre ?? 'este restaurante'}
        onConfirmar={confirmarCambioDeRestaurante}
        onCerrar={() => setConflicto(null)}
      />
    </div>
  );
};

const PastillaActiva: React.FC<{ etiqueta: string; onQuitar: () => void }> = ({
  etiqueta,
  onQuitar,
}) => (
  <button
    type="button"
    onClick={onQuitar}
    className="af-pulsar inline-flex items-center gap-1.5 rounded-full bg-af-surface px-3 py-1.5 text-[12px] font-semibold text-af-ink transition-opacity hover:opacity-80"
    aria-label={`Quitar el filtro ${etiqueta}`}
  >
    {etiqueta}
    <X size={12} aria-hidden="true" />
  </button>
);

const Estado: React.FC<{
  titulo: string;
  texto: string;
  accion?: React.ReactNode;
}> = ({ titulo, texto, accion }) => (
  <div className="flex flex-col items-center gap-3 py-24 text-center">
    <span className="rounded-2xl bg-af-surface p-3 text-af-ink-secondary">
      <UtensilsCrossed size={22} aria-hidden="true" />
    </span>
    <h2 className="text-[19px] font-semibold tracking-tight text-af-ink">{titulo}</h2>
    <p className="max-w-sm text-[14px] leading-relaxed text-af-ink-secondary">{texto}</p>
    {accion && <div className="mt-2">{accion}</div>}
  </div>
);

export default PaginaDescubrir;
