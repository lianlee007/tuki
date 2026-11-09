import { useCallback, useEffect, useState } from 'react';
import type { Auditoria, Panorama, RestauranteAdmin } from '@tuki/api-cliente';
import { mensajeDeError } from '@tuki/api-cliente';
import { usarAuth } from '@tuki/auth-react';
import {
  Boton,
  Cabecera,
  Cargando,
  Etiqueta,
  MensajeError,
  Tarjeta,
} from '@tuki/ui-kit';
import { apis } from '../apis';

export const PanelAdmin = () => {
  const { usuario, salir } = usarAuth();
  const [panorama, setPanorama] = useState<Panorama | null>(null);
  const [restaurantes, setRestaurantes] = useState<RestauranteAdmin[]>([]);
  const [auditoria, setAuditoria] = useState<Auditoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [resumen, lista, eventos] = await Promise.all([
        apis.admin.panorama(),
        apis.admin.restaurantes({ limite: 60 }),
        apis.admin.auditoria(),
      ]);
      setPanorama(resumen);
      setRestaurantes(lista.items);
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

  const cambiarEstado = async (id: string, activo: boolean) => {
    try {
      await apis.admin.cambiarEstado(id, activo);
      await cargar();
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    }
  };

  const totalUsuarios = panorama
    ? panorama.usuarios.cliente + panorama.usuarios.dueno + panorama.usuarios.superadmin
    : 0;

  return (
    <>
      <Cabecera titulo="TukiTuki Admin">
        <span>{usuario?.email}</span>
        <button className="tuki-btn tuki-btn-secundario" onClick={() => void salir()}>
          Salir
        </button>
      </Cabecera>

      <main className="tuki-main">
        <h1 className="tuki-titulo">Estado de la plataforma</h1>
        {error ? <MensajeError>{error}</MensajeError> : null}
        {cargando ? <Cargando /> : null}

        {panorama ? (
          <div className="tuki-grid" style={{ marginBottom: 24 }}>
            <Tarjeta>
              <small>Usuarios</small>
              <h2>{totalUsuarios}</h2>
              <small>
                {panorama.usuarios.cliente} clientes · {panorama.usuarios.dueno} dueños
              </small>
            </Tarjeta>
            <Tarjeta>
              <small>Restaurantes</small>
              <h2>{panorama.restaurantes.activos}</h2>
              <small>de {panorama.restaurantes.total} publicados</small>
            </Tarjeta>
            <Tarjeta>
              <small>Pedidos</small>
              <h2>{panorama.pedidos.total}</h2>
              <small>{panorama.pedidos.pendientes} pendientes</small>
            </Tarjeta>
            <Tarjeta>
              <small>Ingresos</small>
              <h2>${panorama.pedidos.ingresos.toLocaleString('es-CO')}</h2>
              <small>pedidos no cancelados</small>
            </Tarjeta>
          </div>
        ) : null}

        <h2>Restaurantes</h2>
        <div className="tuki-grid">
          {restaurantes.map((restaurante) => (
            <Tarjeta key={restaurante.id}>
              <div className="tuki-fila">
                <strong>{restaurante.nombre}</strong>
                <Etiqueta>{restaurante.activo ? 'Activo' : 'Suspendido'}</Etiqueta>
              </div>
              <p>{restaurante.ciudad ?? 'Sin ciudad'}</p>
              <small>Dueño: {restaurante.duenoId.slice(0, 8)}…</small>
              <Boton
                type="button"
                secundario
                onClick={() => void cambiarEstado(restaurante.id, !restaurante.activo)}
              >
                {restaurante.activo ? 'Suspender' : 'Activar'}
              </Boton>
            </Tarjeta>
          ))}
        </div>

        <h2 style={{ marginTop: 28 }}>Auditoría reciente</h2>
        <Tarjeta>
          <ul className="tuki-lista">
            {auditoria.slice(0, 8).map((evento) => (
              <li key={evento.id}>
                <strong>{evento.accion}</strong> · {evento.entidad}{' '}
                {evento.entidadId?.slice(0, 8) ?? ''}
                <small style={{ display: 'block', color: 'var(--tuki-texto-suave)' }}>
                  {new Date(evento.creadoEn).toLocaleString('es-CO')}
                </small>
              </li>
            ))}
          </ul>
          {auditoria.length === 0 ? <p>Sin acciones registradas.</p> : null}
        </Tarjeta>
      </main>
    </>
  );
};
