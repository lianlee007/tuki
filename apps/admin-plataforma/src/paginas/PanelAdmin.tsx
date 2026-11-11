import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  Auditoria as Evento,
  Panorama as Resumen,
  RestauranteAdmin,
} from '@tuki/api-cliente';
import { mensajeDeError } from '@tuki/api-cliente';
import type { Rol, Usuario } from '@tuki/dominio';
import { usarAuth } from '@tuki/auth-react';
import { apis, urlSitioPublico } from '../apis';
import { Auditoria, type FiltroAuditoria } from '../componentes/Auditoria';
import { NavegacionLateral, NavegacionMovil } from '../componentes/Navegacion';
import { Panorama } from '../componentes/Panorama';
import { Restaurantes, type FiltroRestaurantes } from '../componentes/Restaurantes';
import { Usuarios, type FiltroUsuarios } from '../componentes/Usuarios';
import {
  IconoAlerta,
  IconoBuscar,
  IconoRefrescar,
  IconoSalir,
} from '../componentes/iconos';
import {
  Aviso,
  Avatar,
  Buscador,
  BotonIcono,
  BotonTema,
  EsqueletoPanel,
  Marca,
  ModalConfirmacion,
} from '../componentes/ui';
import { useTema } from '../hooks/useTema';
import {
  ETIQUETAS_ROL,
  formatearNumero,
  nombreCompleto,
  normalizarTexto,
} from '../lib/formato';
import type { AccionPendiente, Vista } from '../tipos';
import { VISTAS } from '../tipos';

const TITULOS: Record<Vista, string> = {
  panorama: 'Estado de la plataforma',
  restaurantes: 'Restaurantes',
  usuarios: 'Cuentas',
  auditoria: 'Auditoría',
};

const PLACEHOLDERS: Record<Exclude<Vista, 'panorama'>, string> = {
  restaurantes: 'Buscar por nombre o ciudad…',
  usuarios: 'Buscar por correo o nombre…',
  auditoria: 'Buscar acción, entidad o identificador…',
};

type AvisoEstado = { id: number; tipo: 'exito' | 'error'; texto: string };

export const PanelAdmin = () => {
  const { usuario, salir } = usarAuth();
  const { tema, alternar } = useTema();
  const [params, setParams] = useSearchParams();

  const vistaCruda = params.get('vista');
  const vista: Vista = VISTAS.includes(vistaCruda as Vista)
    ? (vistaCruda as Vista)
    : 'panorama';

  const [panorama, setPanorama] = useState<Resumen | null>(null);
  const [restaurantes, setRestaurantes] = useState<RestauranteAdmin[]>([]);
  const [totalRestaurantes, setTotalRestaurantes] = useState(0);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [auditoria, setAuditoria] = useState<Evento[]>([]);

  const [cargando, setCargando] = useState(true);
  const [cargandoRestaurantes, setCargandoRestaurantes] = useState(false);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<AvisoEstado | null>(null);

  const [busquedaRestaurantes, setBusquedaRestaurantes] = useState('');
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
  const [busquedaAuditoria, setBusquedaAuditoria] = useState('');
  const [filtroRestaurantes, setFiltroRestaurantes] = useState<FiltroRestaurantes>('todos');
  const [filtroUsuarios, setFiltroUsuarios] = useState<FiltroUsuarios>('todos');
  const [filtroAuditoria, setFiltroAuditoria] = useState<FiltroAuditoria>('todos');

  const [accionPendiente, setAccionPendiente] = useState<AccionPendiente | null>(null);
  const [procesando, setProcesando] = useState(false);

  const buscadorRef = useRef<HTMLInputElement>(null);
  const primeraBusquedaRestaurantes = useRef(true);
  const primeraBusquedaUsuarios = useRef(true);
  const solicitudRestaurantes = useRef(0);
  const solicitudUsuarios = useRef(0);

  const avisar = useCallback((tipo: 'exito' | 'error', texto: string) => {
    setAviso({ id: Date.now(), tipo, texto });
  }, []);

  const cargar = useCallback(async (qRestaurantes = '', qUsuarios = '') => {
    setCargando(true);
    setError(null);
    try {
      const [resumen, listaRestaurantes, listaUsuarios, eventos] = await Promise.all([
        apis.admin.panorama(),
        apis.admin.restaurantes({ q: qRestaurantes.trim() || undefined, limite: 100 }),
        apis.admin.usuarios({ q: qUsuarios.trim() || undefined, limite: 100 }),
        apis.admin.auditoria(),
      ]);
      setPanorama(resumen);
      setRestaurantes(listaRestaurantes.items);
      setTotalRestaurantes(listaRestaurantes.total);
      setUsuarios(listaUsuarios.items);
      setTotalUsuarios(listaUsuarios.total);
      setAuditoria(eventos.items);
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const refrescarResumenYAuditoria = useCallback(async () => {
    try {
      const [resumen, eventos] = await Promise.all([
        apis.admin.panorama(),
        apis.admin.auditoria(),
      ]);
      setPanorama(resumen);
      setAuditoria(eventos.items);
    } catch {
      /* el resumen se actualizará en la próxima recarga */
    }
  }, []);

  const cargarRestaurantes = useCallback(
    async (q: string) => {
      const solicitud = ++solicitudRestaurantes.current;
      setCargandoRestaurantes(true);
      try {
        const resultado = await apis.admin.restaurantes({
          q: q.trim() || undefined,
          limite: 100,
        });
        if (solicitud !== solicitudRestaurantes.current) return;
        setRestaurantes(resultado.items);
        setTotalRestaurantes(resultado.total);
      } catch (fallo) {
        if (solicitud === solicitudRestaurantes.current) {
          avisar('error', mensajeDeError(fallo));
        }
      } finally {
        if (solicitud === solicitudRestaurantes.current) {
          setCargandoRestaurantes(false);
        }
      }
    },
    [avisar],
  );

  const cargarUsuarios = useCallback(
    async (q: string) => {
      const solicitud = ++solicitudUsuarios.current;
      setCargandoUsuarios(true);
      try {
        const resultado = await apis.admin.usuarios({
          q: q.trim() || undefined,
          limite: 100,
        });
        if (solicitud !== solicitudUsuarios.current) return;
        setUsuarios(resultado.items);
        setTotalUsuarios(resultado.total);
      } catch (fallo) {
        if (solicitud === solicitudUsuarios.current) {
          avisar('error', mensajeDeError(fallo));
        }
      } finally {
        if (solicitud === solicitudUsuarios.current) {
          setCargandoUsuarios(false);
        }
      }
    },
    [avisar],
  );

  useEffect(() => {
    if (primeraBusquedaRestaurantes.current) {
      primeraBusquedaRestaurantes.current = false;
      return;
    }
    const temporizador = window.setTimeout(() => {
      void cargarRestaurantes(busquedaRestaurantes);
    }, 280);
    return () => window.clearTimeout(temporizador);
  }, [busquedaRestaurantes, cargarRestaurantes]);

  useEffect(() => {
    if (primeraBusquedaUsuarios.current) {
      primeraBusquedaUsuarios.current = false;
      return;
    }
    const temporizador = window.setTimeout(() => {
      void cargarUsuarios(busquedaUsuarios);
    }, 280);
    return () => window.clearTimeout(temporizador);
  }, [busquedaUsuarios, cargarUsuarios]);

  /* El atajo «/» lleva el foco a la búsqueda, como en las consolas técnicas. */
  useEffect(() => {
    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key !== '/' || evento.metaKey || evento.ctrlKey || evento.altKey) return;
      const objetivo = evento.target as HTMLElement | null;
      const estaEscribiendo =
        objetivo instanceof HTMLInputElement ||
        objetivo instanceof HTMLTextAreaElement ||
        objetivo instanceof HTMLSelectElement ||
        Boolean(objetivo?.isContentEditable);
      if (estaEscribiendo) return;
      if (!buscadorRef.current) return;
      evento.preventDefault();
      buscadorRef.current.focus();
    };

    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [vista]);

  useEffect(() => {
    document.title = `TukiTuki Admin — ${TITULOS[vista]}`;
  }, [vista]);

  const irA = (destino: Vista) => {
    setParams(
      (previos) => {
        const siguientes = new URLSearchParams(previos);
        if (destino === 'panorama') siguientes.delete('vista');
        else siguientes.set('vista', destino);
        return siguientes;
      },
      { replace: false },
    );
  };

  const textoBusqueda =
    vista === 'restaurantes'
      ? busquedaRestaurantes
      : vista === 'usuarios'
        ? busquedaUsuarios
        : vista === 'auditoria'
          ? busquedaAuditoria
          : '';

  const cambiarBusqueda = (texto: string) => {
    if (vista === 'restaurantes') setBusquedaRestaurantes(texto);
    if (vista === 'usuarios') setBusquedaUsuarios(texto);
    if (vista === 'auditoria') setBusquedaAuditoria(texto);
  };

  const auditoriaFiltrada = useMemo(() => {
    const consulta = normalizarTexto(busquedaAuditoria);
    if (!consulta) return auditoria;
    return auditoria.filter((evento) => {
      const contenido = [
        evento.accion,
        evento.entidad,
        evento.entidadId ?? '',
        evento.actorId,
        JSON.stringify(evento.detalle),
      ];
      return contenido.some((valor) => normalizarTexto(valor).includes(consulta));
    });
  }, [auditoria, busquedaAuditoria]);

  const solicitarEstado = (restaurante: RestauranteAdmin) => {
    setAccionPendiente({
      tipo: 'restaurante',
      id: restaurante.id,
      nombre: restaurante.nombre,
      activo: !restaurante.activo,
    });
  };

  const solicitarRol = (cuenta: Usuario, rolNuevo: Rol) => {
    if (cuenta.id === usuario?.id) {
      avisar('error', 'No puedes cambiar tu propio rol desde aquí.');
      return;
    }
    setAccionPendiente({
      tipo: 'rol',
      id: cuenta.id,
      nombre: nombreCompleto(cuenta.nombre, cuenta.apellido),
      rolActual: cuenta.rol,
      rolNuevo,
    });
  };

  const confirmarAccion = async () => {
    if (!accionPendiente) return;
    setProcesando(true);
    try {
      if (accionPendiente.tipo === 'restaurante') {
        const actualizado = await apis.admin.cambiarEstado(
          accionPendiente.id,
          accionPendiente.activo,
        );
        setRestaurantes((previos) =>
          previos.map((restaurante) =>
            restaurante.id === actualizado.id ? actualizado : restaurante,
          ),
        );
        avisar(
          'exito',
          accionPendiente.activo
            ? `«${accionPendiente.nombre}» quedó activo.`
            : `«${accionPendiente.nombre}» quedó suspendido.`,
        );
      } else {
        const respuesta = await apis.admin.cambiarRol(
          accionPendiente.id,
          accionPendiente.rolNuevo,
        );
        setUsuarios((previos) =>
          previos.map((cuenta) =>
            cuenta.id === respuesta.usuario.id ? respuesta.usuario : cuenta,
          ),
        );
        avisar(
          'exito',
          `El rol de «${accionPendiente.nombre}» quedó actualizado.`,
        );
      }

      setAccionPendiente(null);
      await refrescarResumenYAuditoria();
    } catch (fallo) {
      avisar('error', mensajeDeError(fallo));
      setAccionPendiente(null);
    } finally {
      setProcesando(false);
    }
  };

  const copiarId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      avisar('exito', 'Identificador copiado al portapapeles.');
    } catch {
      avisar('error', 'No se pudo copiar. Selecciona el identificador manualmente.');
    }
  };

  const verLocal = (restaurante: RestauranteAdmin) => {
    window.open(
      `${urlSitioPublico}/restaurante/${encodeURIComponent(restaurante.slug)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const exportarAuditoria = () => {
    const filas: string[][] = [
      ['fecha', 'accion', 'entidad', 'entidadId', 'actorId', 'detalle'],
      ...auditoria.map((evento) => [
        evento.creadoEn,
        evento.accion,
        evento.entidad,
        evento.entidadId ?? '',
        evento.actorId,
        JSON.stringify(evento.detalle),
      ]),
    ];
    const csv = filas
      .map((fila) => fila.map((celda) => `"${celda.replaceAll('"', '""')}"`).join(','))
      .join('\r\n');
    const archivo = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = `tukituki-auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
    avisar('exito', 'Auditoría exportada como CSV.');
  };

  const modal = (() => {
    if (!accionPendiente) return null;
    if (accionPendiente.tipo === 'restaurante') {
      return {
        titulo: accionPendiente.activo ? 'Activar restaurante' : 'Suspender restaurante',
        descripcion: accionPendiente.activo
          ? `«${accionPendiente.nombre}» volverá a aparecer en la plataforma y podrá recibir pedidos.`
          : `«${accionPendiente.nombre}» dejará de aparecer en la plataforma hasta que lo actives de nuevo.`,
        textoConfirmar: accionPendiente.activo ? 'Activar' : 'Suspender',
        peligro: !accionPendiente.activo,
      };
    }
    return {
      titulo: 'Cambiar rol de la cuenta',
      descripcion: `Vas a cambiar el rol de «${accionPendiente.nombre}». El cambio se registra en la auditoría y afecta de inmediato sus permisos.`,
      textoConfirmar: 'Cambiar rol',
      peligro: accionPendiente.rolNuevo === 'superadmin',
    };
  })();

  const totalRestaurantesLabel = formatearNumero(panorama?.restaurantes.total ?? 0);
  const totalUsuariosLabel = panorama
    ? formatearNumero(
        panorama.usuarios.cliente +
          panorama.usuarios.dueno +
          panorama.usuarios.superadmin,
      )
    : '0';

  return (
    <div className="admin-app">
      <a href="#admin-contenido" className="admin-saltar">
        Saltar al contenido
      </a>

      <div className="admin-shell">
        <NavegacionLateral
          vista={vista}
          onCambiar={irA}
          email={usuario?.email ?? ''}
          onSalir={() => void salir()}
        />

        <div className="admin-contenido">
          <header className="admin-topbar">
            <div className="admin-topbar-identidad">
              <span className="admin-topbar-marca-movil">
                <Marca compacta />
              </span>
              <div className="admin-topbar-titulos">
                <p>Consola de plataforma</p>
                <h1>{TITULOS[vista]}</h1>
              </div>
            </div>

            <div className="admin-topbar-acciones">
              {vista === 'panorama' ? (
                <button
                  type="button"
                  className="admin-topbar-buscar-atajo"
                  onClick={() => irA('restaurantes')}
                >
                  <IconoBuscar size={16} />
                  Buscar en la plataforma
                </button>
              ) : (
                <Buscador
                  valor={textoBusqueda}
                  onCambio={cambiarBusqueda}
                  placeholder={PLACEHOLDERS[vista]}
                  etiqueta={PLACEHOLDERS[vista]}
                  inputRef={buscadorRef}
                  atajo
                />
              )}

              <BotonIcono
                etiqueta={cargando ? 'Actualizando datos' : 'Actualizar datos'}
                onClick={() => void cargar(busquedaRestaurantes, busquedaUsuarios)}
                disabled={cargando}
              >
                <IconoRefrescar size={18} className={cargando ? 'admin-girando' : undefined} />
              </BotonIcono>

              <BotonTema tema={tema} alternar={alternar} />

              <BotonIcono
                etiqueta="Cerrar sesión"
                className="admin-solo-movil"
                onClick={() => void salir()}
              >
                <IconoSalir size={18} />
              </BotonIcono>

              <span className="admin-topbar-avatar" title={usuario?.email ?? 'Sesión de administración'}>
                <Avatar
                  nombre={usuario?.nombre ?? 'A'}
                  apellido={usuario?.apellido ?? 'D'}
                  tono="salvia"
                />
              </span>
            </div>
          </header>

          <main id="admin-contenido" className="admin-main">
            {error ? (
              <div className="admin-error" role="alert">
                <span className="admin-error-icono">
                  <IconoAlerta size={20} />
                </span>
                <div>
                  <strong>No pudimos cargar la consola</strong>
                  <p>{error}</p>
                </div>
                <button type="button" className="admin-btn admin-btn-secundario" onClick={() => void cargar(busquedaRestaurantes, busquedaUsuarios)}>
                  Reintentar
                </button>
              </div>
            ) : null}

            {cargando && !panorama ? <EsqueletoPanel /> : null}

            {panorama ? (
              vista === 'panorama' ? (
                <Panorama
                  panorama={panorama}
                  restaurantes={restaurantes}
                  auditoria={auditoria}
                  onVerRestaurantes={() => irA('restaurantes')}
                  onVerUsuarios={() => irA('usuarios')}
                  onVerAuditoria={() => irA('auditoria')}
                  onCambiarEstado={solicitarEstado}
                />
              ) : vista === 'restaurantes' ? (
                <Restaurantes
                  restaurantes={restaurantes}
                  total={totalRestaurantes}
                  busqueda={busquedaRestaurantes}
                  filtro={filtroRestaurantes}
                  cargando={cargandoRestaurantes}
                  onFiltro={setFiltroRestaurantes}
                  onLimpiarBusqueda={() => setBusquedaRestaurantes('')}
                  onCambiarEstado={solicitarEstado}
                  onCopiarId={(id) => void copiarId(id)}
                  onVerLocal={verLocal}
                />
              ) : vista === 'usuarios' ? (
                <Usuarios
                  usuarios={usuarios}
                  total={totalUsuarios}
                  busqueda={busquedaUsuarios}
                  filtro={filtroUsuarios}
                  cargando={cargandoUsuarios}
                  usuarioActualId={usuario?.id}
                  onFiltro={setFiltroUsuarios}
                  onLimpiarBusqueda={() => setBusquedaUsuarios('')}
                  onSolicitarRol={solicitarRol}
                />
              ) : (
                <Auditoria
                  eventos={auditoriaFiltrada}
                  busqueda={busquedaAuditoria}
                  filtro={filtroAuditoria}
                  onFiltro={setFiltroAuditoria}
                  onLimpiarBusqueda={() => setBusquedaAuditoria('')}
                  onExportar={exportarAuditoria}
                />
              )
            ) : null}

            {!panorama && !cargando && !error ? (
              <div className="admin-card">
                <p>No hay datos disponibles para mostrar.</p>
              </div>
            ) : null}

            {panorama ? (
              <p className="admin-pie" aria-live="polite">
                {totalRestaurantesLabel} restaurantes y {totalUsuariosLabel} cuentas en la
                plataforma.
              </p>
            ) : null}
          </main>
        </div>
      </div>

      <NavegacionMovil vista={vista} onCambiar={irA} />

      {aviso ? (
        <Aviso
          key={aviso.id}
          tipo={aviso.tipo}
          texto={aviso.texto}
          onCerrar={() => setAviso(null)}
        />
      ) : null}

      <ModalConfirmacion
        abierto={Boolean(modal)}
        titulo={modal?.titulo ?? ''}
        descripcion={modal?.descripcion ?? ''}
        textoConfirmar={modal?.textoConfirmar ?? 'Confirmar'}
        peligro={modal?.peligro ?? false}
        procesando={procesando}
        onConfirmar={() => void confirmarAccion()}
        onCerrar={() => {
          if (!procesando) setAccionPendiente(null);
        }}
      >
        {accionPendiente?.tipo === 'rol' ? (
          <div className="admin-modal-detalle">
            <div>
              <span>Rol actual</span>
              <strong>{ETIQUETAS_ROL[accionPendiente.rolActual]}</strong>
            </div>
            <span aria-hidden="true">→</span>
            <div>
              <span>Rol nuevo</span>
              <strong>{ETIQUETAS_ROL[accionPendiente.rolNuevo]}</strong>
            </div>
          </div>
        ) : null}
      </ModalConfirmacion>
    </div>
  );
};
