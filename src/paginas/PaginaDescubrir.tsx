import React, { useEffect, useMemo, useRef, useState } from 'react';
// @ts-ignore
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Heart,
  SlidersHorizontal,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { SEO } from '../componentes/ui';
import { BarraDescubrir } from '../componentes/descubrir/BarraDescubrir';
import { BarraMovil } from '../componentes/descubrir/BarraMovil';
import { CarrilCocinas } from '../componentes/descubrir/CarrilCocinas';
import { CarrilRestaurantes } from '../componentes/descubrir/CarrilRestaurantes';
import { PanelFiltros } from '../componentes/descubrir/PanelFiltros';
import { FiltrosRapidos } from '../componentes/descubrir/FiltrosRapidos';
import { PanelCarrito } from '../componentes/descubrir/PanelCarrito';
import { ResumenCarrito } from '../componentes/descubrir/ResumenCarrito';
import { Inspiracion } from '../componentes/descubrir/Inspiracion';
import { ModalPlato } from '../componentes/descubrir/ModalPlato';
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
import {
  BOTON_FANTASMA,
  BOTON_PRIMARIO,
  ETIQUETA,
  FOCO,
  TARJETA,
} from '../componentes/descubrir/estilos';
import { apiDescubrir } from '../api/apiDescubrir';
import { useAuth } from '../contexto/ContextoAutenticacion';
import { useFavoritos } from '../hooks/useFavoritos';
import { useStoreCarrito } from '../modulos/pedidos';
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
  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2" aria-hidden="true">
    {Array.from({ length: 4 }).map((_, indice) => (
      <div key={indice} className={`${TARJETA} p-3.5`}>
        <div className="aspect-[4/3] rounded-2xl bg-hearth-oat dark:bg-hearth-night-oat" />
        <div className="mt-3.5 h-4 w-3/4 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
        <div className="mt-2 h-3 w-1/2 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="h-6 w-24 rounded-full bg-hearth-oat dark:bg-hearth-night-oat" />
          <div className="h-9 w-32 rounded-xl bg-hearth-oat dark:bg-hearth-night-oat" />
        </div>
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

  const { favoritos, esFavorito, alternar } = useFavoritos();
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [detalle, setDetalle] = useState<PlatoDescubierto | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const refBuscador = useRef<HTMLInputElement>(null);

  /* Un aviso vive lo justo para leerse; no se apila. */
  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(null), 2800);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const avisar = (mensaje: string) => setAviso(mensaje);

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
    apiDescubrir.cocinas().then(({ cocinas: encontradas }) => {
      if (vigente) setCocinas(encontradas);
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
   * Los restaurantes responden al texto y a la cocina, no al precio ni a la
   * dieta: esos filtros son del plato que se va a comer, no del local.
   */
  useEffect(() => {
    let vigente = true;
    setCargandoRestaurantes(true);

    apiDescubrir
      .restaurantes({ q: consulta, cocina, limite: 8 })
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
      ? dietas.filter((claveDieta) => claveDieta !== dieta)
      : [...dietas, dieta];
    actualizar({ dietas: siguientes.join(',') || null });
  };

  const limpiar = () => {
    setTexto('');
    setSoloFavoritos(false);
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

    if (resultado === 'otro-restaurante') {
      setConflicto(plato);
      return;
    }

    avisar(`«${plato.nombre}» se sumó a tu pedido`);
  };

  const confirmarCambioDeRestaurante = () => {
    if (!conflicto) return;
    useStoreCarrito
      .getState()
      .reemplazarCarrito(aPlatillo(conflicto), conflicto.restaurante_nombre);
    setConflicto(null);
    avisar(`Empezaste un pedido en ${conflicto.restaurante_nombre}`);
  };

  const cambiarACuentaCliente = async () => {
    await cerrarSesion();
    setCuentaAbierta(false);
    navigate('/entrar');
  };

  const alternarFavorito = (plato: PlatoDescubierto) => {
    const yaEra = esFavorito(plato.id);
    alternar(plato.id);
    avisar(yaEra ? 'Quitado de tus favoritos' : `Guardado en favoritos: ${plato.nombre}`);
  };

  const sorprender = () => {
    if (platos.length === 0) return;
    const elegido = platos[Math.floor(Math.random() * platos.length)];
    setDetalle(elegido);
  };

  const irAInicio = () => {
    setSoloFavoritos(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const enfocarBuscador = () => {
    refBuscador.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const verFavoritos = () => {
    const siguiente = !soloFavoritos;
    setSoloFavoritos(siguiente);
    avisar(
      siguiente
        ? favoritos.length > 0
          ? 'Mostrando solo tus favoritos'
          : 'Todavía no has guardado favoritos'
        : 'Mostrando todos los platos'
    );
    document
      .getElementById('catalogo-platos')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const irARestaurantes = () => {
    document
      .getElementById('restaurantes')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const platosVisibles = useMemo(
    () => (soloFavoritos ? platos.filter((plato) => esFavorito(plato.id)) : platos),
    [platos, soloFavoritos, esFavorito]
  );

  const filtrosActivos = (cocina ? 1 : 0) + (precio ? 1 : 0) + dietas.length;
  const cocinaElegida = cocinas.find((tipo) => tipo.slug === cocina);
  const hayFiltros = filtrosActivos > 0 || consulta.trim().length > 0;
  const primerPintado = cargando && platos.length === 0;
  const volver = `${location.pathname}${location.search}`;
  const rutaCuenta = user ? '/mi-cuenta' : '/entrar';

  const totalMostrado = soloFavoritos ? platosVisibles.length : total;
  const etiquetaTotal = primerPintado
    ? 'Buscando platos…'
    : error
      ? 'Sin resultados'
      : soloFavoritos
        ? totalMostrado === 1
          ? '1 favorito en esta búsqueda'
          : `${totalMostrado} favoritos en esta búsqueda`
        : totalMostrado === 1
          ? '1 plato'
          : `${totalMostrado.toLocaleString('es-CO')} platos`;

  return (
    <div className="min-h-screen bg-hearth-cream font-jakarta text-hearth-espresso transition-colors dark:bg-hearth-night dark:text-hearth-night-ink">
      <SEO
        titulo="Tuki — Descubre platos de restaurantes"
        descripcion="Busca platos por cocina, precio y preferencias. Encuentra qué comer y pide directo al restaurante."
      />

      <BarraDescubrir
        consulta={texto}
        onConsulta={setTexto}
        onCarrito={() => setCarritoAbierto(true)}
        cantidadCarrito={cantidadCarrito}
        inputRef={refBuscador}
      />

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-16">
        <div className="grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-8">
          <div className="flex min-w-0 flex-col gap-7">
            <CarrilCocinas
              cocinas={cocinas}
              activa={cocina}
              onElegir={(slug) => actualizar({ cocina: slug })}
              totalPlatos={total}
              totalRestaurantes={totalRestaurantes}
              onVerRestaurantes={irARestaurantes}
            />

            <section id="catalogo-platos" aria-labelledby="titulo-platos" className="scroll-mt-28">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className={`${ETIQUETA} text-hearth-terracotta-ink dark:text-hearth-night-terracotta-ink`}>
                    El feed de hoy
                  </p>
                  <h2
                    id="titulo-platos"
                    className="mt-1 font-jakarta text-[clamp(1.35rem,3vw,1.7rem)] font-extrabold tracking-[-0.025em] text-hearth-espresso dark:text-hearth-night-ink"
                  >
                    Platos en tendencia
                  </h2>
                  <p aria-live="polite" className="mt-0.5 text-[12.5px] text-hearth-pebble dark:text-hearth-night-pebble">
                    {etiquetaTotal}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={verFavoritos}
                    aria-pressed={soloFavoritos}
                    className={`af-pulsar inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[12px] font-bold transition-colors ${FOCO} ${
                      soloFavoritos
                        ? 'bg-hearth-terracotta-deep text-white shadow-warm dark:bg-hearth-night-terracotta dark:text-hearth-night'
                        : 'bg-hearth-card text-hearth-pebble ring-1 ring-hearth-line/70 hover:text-hearth-terracotta-ink dark:bg-hearth-night-card dark:text-hearth-night-pebble dark:ring-hearth-night-line'
                    }`}
                  >
                    <Heart
                      size={14}
                      aria-hidden="true"
                      className={soloFavoritos ? 'fill-current' : undefined}
                    />
                    Favoritos
                    {favoritos.length > 0 && (
                      <span className="rounded-full bg-hearth-honey/25 px-1.5 text-[10px] font-extrabold tabular-nums">
                        {favoritos.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltrosAbiertos(true)}
                    className={`af-pulsar inline-flex items-center gap-1.5 rounded-xl bg-hearth-card px-3.5 py-2.5 text-[12px] font-bold text-hearth-pebble ring-1 ring-hearth-line/70 transition-colors hover:text-hearth-espresso lg:hidden dark:bg-hearth-night-card dark:text-hearth-night-pebble dark:ring-hearth-night-line dark:hover:text-hearth-night-ink ${FOCO}`}
                  >
                    <SlidersHorizontal size={14} aria-hidden="true" />
                    Filtros
                    {filtrosActivos > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-hearth-terracotta-deep px-1 text-[10px] font-extrabold tabular-nums text-white dark:bg-hearth-night-terracotta dark:text-hearth-night">
                        {filtrosActivos}
                      </span>
                    )}
                  </button>
                </div>
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
                      etiqueta={
                        DIETAS.find((opcion) => opcion.clave === dieta)?.etiqueta ?? dieta
                      }
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
                      className={BOTON_PRIMARIO}
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
                      <button type="button" onClick={limpiar} className={BOTON_PRIMARIO}>
                        Quitar los filtros
                      </button>
                    ) : undefined
                  }
                />
              ) : soloFavoritos && platosVisibles.length === 0 ? (
                <Estado
                  titulo="Todavía no has guardado favoritos"
                  texto="Toca el corazón de un plato y lo encontrarás aquí la próxima vez."
                  accion={
                    <button
                      type="button"
                      onClick={() => setSoloFavoritos(false)}
                      className={BOTON_PRIMARIO}
                    >
                      Ver todos los platos
                    </button>
                  }
                />
              ) : (
                <>
                  <div
                    className={`mt-5 grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 ${
                      cargando ? 'opacity-60' : 'opacity-100'
                    }`}
                    aria-busy={cargando}
                  >
                    {platosVisibles.map((plato, indice) => (
                      <TarjetaPlato
                        key={plato.id}
                        plato={plato}
                        destacado={indice === 0 && !hayFiltros && !soloFavoritos}
                        esFavorito={esFavorito(plato.id)}
                        onFavorito={alternarFavorito}
                        onVerDetalle={setDetalle}
                        onAgregar={agregarAlCarrito}
                      />
                    ))}
                  </div>

                  {!soloFavoritos && platos.length < total && (
                    <div className="mt-8 flex justify-center">
                      <button
                        type="button"
                        onClick={cargarMas}
                        disabled={cargandoMas}
                        className={BOTON_FANTASMA}
                      >
                        {cargandoMas ? 'Cargando…' : 'Ver más platos'}
                        {!cargandoMas && <ArrowRight size={16} aria-hidden="true" />}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            <div id="restaurantes" className="scroll-mt-28">
              <CarrilRestaurantes
                restaurantes={restaurantes}
                total={totalRestaurantes}
                cargando={cargandoRestaurantes}
                cocinaCoincidente={cocinaElegida?.nombre ?? null}
              />
            </div>

            <footer className={`${TARJETA} flex flex-col items-center gap-2 p-6 text-center`}>
              <p className="text-[13px] text-hearth-pebble dark:text-hearth-night-pebble">
                ¿Tienes un restaurante?
              </p>
              <Link
                to="/para-restaurantes"
                className="af-pulsar inline-flex items-center gap-1.5 font-jakarta text-[15px] font-extrabold text-hearth-terracotta-ink transition-colors hover:text-hearth-terracotta-deep dark:text-hearth-night-terracotta-ink dark:hover:text-hearth-night-terracotta"
              >
                Crea tu menú con Tuki
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </footer>
          </div>

          <aside
            className="af-sin-scrollbar hidden flex-col gap-5 [&>*]:shrink-0 xl:sticky xl:top-24 xl:flex xl:max-h-[calc(100vh-7rem)] xl:self-start xl:overflow-y-auto"
            aria-label="Atajos y tu pedido"
          >
            <Inspiracion cantidadPlatos={platos.length} onSorprender={sorprender} />

            <ResumenCarrito
              carrito={carrito}
              cantidad={cantidadCarrito}
              total={totalCarrito}
              onAbrir={() => setCarritoAbierto(true)}
            />

            <FiltrosRapidos
              precio={precio}
              dietas={dietas}
              onPrecio={(nuevo) => actualizar({ precio: nuevo || null })}
              onDieta={alternarDieta}
              onLimpiar={limpiar}
            />
          </aside>
        </div>
      </main>

      <BarraMovil
        favoritosActivos={soloFavoritos}
        rutaCuenta={rutaCuenta}
        onInicio={irAInicio}
        onBuscar={enfocarBuscador}
        onFavoritos={verFavoritos}
      />

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

      <ModalPlato
        plato={detalle}
        onCerrar={() => setDetalle(null)}
        esFavorito={detalle ? esFavorito(detalle.id) : false}
        onFavorito={alternarFavorito}
        onAgregar={agregarAlCarrito}
      />

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

      {/* Aviso breve: confirma sin tapar el feed ni mover el pulgar. */}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-4 transition-all duration-300 ${
          aviso
            ? 'bottom-[calc(8.5rem+env(safe-area-inset-bottom))] opacity-100 lg:bottom-8'
            : 'bottom-[calc(7.5rem+env(safe-area-inset-bottom))] translate-y-2 opacity-0 lg:bottom-6'
        }`}
      >
        <div className="flex max-w-sm items-center gap-2.5 rounded-2xl bg-hearth-espresso px-4 py-3 text-[12px] font-bold text-hearth-cream shadow-warm-xl dark:bg-hearth-night-card dark:text-hearth-night-ink dark:ring-1 dark:ring-white/10">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-hearth-terracotta text-[11px] text-white dark:bg-hearth-night-terracotta dark:text-hearth-night">
            ✓
          </span>
          <span className="min-w-0">{aviso}</span>
        </div>
      </div>
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
    className={`af-pulsar inline-flex items-center gap-1.5 rounded-full bg-hearth-terracotta-soft px-3 py-1.5 text-[11.5px] font-bold text-hearth-terracotta-ink ring-1 ring-hearth-terracotta/20 transition-colors hover:bg-[#FBE2D9] dark:bg-hearth-night-terracotta-soft dark:text-hearth-night-terracotta-ink dark:ring-white/10 dark:hover:bg-[#4A2D24] ${FOCO}`}
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
  <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-hearth-oat text-hearth-terracotta-ink dark:bg-hearth-night-oat dark:text-hearth-night-terracotta-ink">
      <UtensilsCrossed size={22} aria-hidden="true" />
    </span>
    <h3 className="font-jakarta text-[17px] font-extrabold tracking-[-0.01em] text-hearth-espresso dark:text-hearth-night-ink">
      {titulo}
    </h3>
    <p className="max-w-sm text-[13px] leading-relaxed text-hearth-pebble dark:text-hearth-night-pebble">
      {texto}
    </p>
    {accion && <div className="mt-2">{accion}</div>}
  </div>
);

export default PaginaDescubrir;
