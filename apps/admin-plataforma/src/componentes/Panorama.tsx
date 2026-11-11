import type { CSSProperties } from 'react';
import type { Auditoria, Panorama as Resumen, RestauranteAdmin } from '@tuki/api-cliente';
import {
  acortarId,
  describirAccion,
  ETIQUETAS_ENTIDAD,
  formatearFecha,
  formatearMoneda,
  formatearNumero,
  formatearRelativo,
  iniciales,
} from '../lib/formato';
import {
  IconoActividad,
  IconoAuditoria,
  IconoDinero,
  IconoFlecha,
  IconoPedido,
  IconoTienda,
  IconoUsuarios,
} from './iconos';
import { EtiquetaEstado, EstadoVacio } from './ui';

const MAX_ACTIVIDAD = 6;
const MAX_LOCALES = 4;

export const Panorama = ({
  panorama,
  restaurantes,
  auditoria,
  onVerRestaurantes,
  onVerUsuarios,
  onVerAuditoria,
  onCambiarEstado,
}: {
  panorama: Resumen;
  restaurantes: RestauranteAdmin[];
  auditoria: Auditoria[];
  onVerRestaurantes: () => void;
  onVerUsuarios: () => void;
  onVerAuditoria: () => void;
  onCambiarEstado: (restaurante: RestauranteAdmin) => void;
}) => {
  const totalUsuarios =
    panorama.usuarios.cliente + panorama.usuarios.dueno + panorama.usuarios.superadmin;
  const totalRestaurantes = panorama.restaurantes.total;
  const activos = panorama.restaurantes.activos;
  const porcentajeActivos =
    totalRestaurantes > 0 ? Math.round((activos / totalRestaurantes) * 100) : 0;
  const pendientes = panorama.pedidos.pendientes;
  const localesRecientes = restaurantes.slice(0, MAX_LOCALES);
  const actividad = auditoria.slice(0, MAX_ACTIVIDAD);

  const cuentas = [
    { clave: 'cliente', etiqueta: 'Comensales', cantidad: panorama.usuarios.cliente, clase: 'primario' },
    { clave: 'dueno', etiqueta: 'Dueños', cantidad: panorama.usuarios.dueno, clase: 'miel' },
    {
      clave: 'superadmin',
      etiqueta: 'Superadmins',
      cantidad: panorama.usuarios.superadmin,
      clase: 'salvia',
    },
  ] as const;

  return (
    <div className="admin-panorama">
      <section className="admin-hero" aria-labelledby="admin-hero-titulo">
        <div className="admin-hero-texto">
          <p className="admin-live">
            <span className="admin-live-punto" aria-hidden="true" />
            Datos al día
          </p>
          <h2 id="admin-hero-titulo">La plataforma, en una mirada.</h2>
          <p>
            Revisa el pulso de TukiTuki, atiende lo pendiente y entra a cualquier
            local o cuenta sin perder el contexto.
          </p>
          <div className="admin-hero-acciones">
            <button type="button" className="admin-btn admin-btn-primario" onClick={onVerRestaurantes}>
              Revisar restaurantes
              <IconoFlecha size={16} />
            </button>
            <button type="button" className="admin-btn admin-btn-secundario" onClick={onVerAuditoria}>
              Ver auditoría
            </button>
          </div>
        </div>

        <div className="admin-hero-salud">
          <div className="admin-donut" style={{ '--admin-progreso': `${porcentajeActivos}%` } as CSSProperties}>
            <div className="admin-donut-centro">
              <strong>{porcentajeActivos}%</strong>
              <span>locales activos</span>
            </div>
          </div>
          <dl className="admin-hero-datos">
            <div>
              <dt>Restaurantes publicados</dt>
              <dd>
                {formatearNumero(activos)}
                <span> de {formatearNumero(totalRestaurantes)}</span>
              </dd>
            </div>
            <div>
              <dt>Pedidos pendientes</dt>
              <dd>{formatearNumero(pendientes)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-label="Indicadores principales" className="admin-metricas">
        <article className="admin-metrica">
          <span className="admin-metrica-icono admin-tono-primario">
            <IconoUsuarios size={20} />
          </span>
          <p className="admin-metrica-etiqueta">Cuentas totales</p>
          <strong className="admin-metrica-valor">{formatearNumero(totalUsuarios)}</strong>
          <p className="admin-metrica-nota">
            {formatearNumero(panorama.usuarios.cliente)} comensales y{' '}
            {formatearNumero(panorama.usuarios.dueno)} dueños
          </p>
        </article>

        <article className="admin-metrica">
          <span className="admin-metrica-icono admin-tono-miel">
            <IconoTienda size={20} />
          </span>
          <p className="admin-metrica-etiqueta">Locales activos</p>
          <strong className="admin-metrica-valor">{formatearNumero(activos)}</strong>
          <p className="admin-metrica-nota">
            {totalRestaurantes > 0
              ? `${porcentajeActivos}% de ${formatearNumero(totalRestaurantes)} publicados`
              : 'Aún no hay restaurantes publicados'}
          </p>
        </article>

        <article className="admin-metrica">
          <span className="admin-metrica-icono admin-tono-salvia">
            <IconoPedido size={20} />
          </span>
          <p className="admin-metrica-etiqueta">Pedidos</p>
          <strong className="admin-metrica-valor">{formatearNumero(panorama.pedidos.total)}</strong>
          <p className="admin-metrica-nota">
            {pendientes > 0
              ? `${formatearNumero(pendientes)} esperando confirmación`
              : 'Nada pendiente por ahora'}
          </p>
        </article>

        <article className="admin-metrica">
          <span className="admin-metrica-icono admin-tono-primario">
            <IconoDinero size={20} />
          </span>
          <p className="admin-metrica-etiqueta">Ingresos registrados</p>
          <strong className="admin-metrica-valor admin-metrica-valor-moneda">
            {formatearMoneda(panorama.pedidos.ingresos)}
          </strong>
          <p className="admin-metrica-nota">Pedidos no cancelados</p>
        </article>
      </section>

      <div className="admin-dos-columnas">
        <section className="admin-card" aria-labelledby="admin-actividad-titulo">
          <div className="admin-card-cabecera">
            <div>
              <h2 id="admin-actividad-titulo" className="admin-card-titulo">
                Actividad reciente
              </h2>
              <p className="admin-card-subtitulo">Lo último que hizo el equipo.</p>
            </div>
            <button type="button" className="admin-enlace" onClick={onVerAuditoria}>
              Ver todo
              <IconoFlecha size={14} />
            </button>
          </div>

          {actividad.length > 0 ? (
            <ol className="admin-timeline">
              {actividad.map((evento) => (
                <li key={evento.id}>
                  <span className="admin-timeline-punto" aria-hidden="true">
                    <IconoActividad size={14} />
                  </span>
                  <div className="admin-timeline-texto">
                    <p>
                      <strong>{describirAccion(evento.accion)}</strong>
                    </p>
                    <p className="admin-timeline-meta">
                      <span>{ETIQUETAS_ENTIDAD[evento.entidad] ?? evento.entidad}</span>
                      <span>{acortarId(evento.entidadId)}</span>
                      <time dateTime={evento.creadoEn} title={formatearFecha(evento.creadoEn)}>
                        {formatearRelativo(evento.creadoEn)}
                      </time>
                    </p>
                    <code className="admin-codigo-accion">{evento.accion}</code>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EstadoVacio
              icono={<IconoAuditoria size={24} />}
              titulo="Sin acciones todavía"
              descripcion="Cuando actives un local o cambies un rol, la acción aparecerá aquí."
            />
          )}
        </section>

        <div className="admin-columna-lateral">
          <section className="admin-card" aria-labelledby="admin-cuentas-titulo">
            <div className="admin-card-cabecera">
              <div>
                <h2 id="admin-cuentas-titulo" className="admin-card-titulo">
                  Distribución de cuentas
                </h2>
                <p className="admin-card-subtitulo">{formatearNumero(totalUsuarios)} en total</p>
              </div>
              <IconoUsuarios size={18} className="admin-card-icono" />
            </div>

            <div className="admin-distribucion">
              {cuentas.map((cuenta) => {
                const porcentaje = totalUsuarios > 0 ? (cuenta.cantidad / totalUsuarios) * 100 : 0;
                return (
                  <div key={cuenta.clave} className="admin-distribucion-fila">
                    <div className="admin-distribucion-texto">
                      <span>{cuenta.etiqueta}</span>
                      <strong>{formatearNumero(cuenta.cantidad)}</strong>
                    </div>
                    <div className="admin-barra">
                      <span
                        className={`admin-barra-relleno admin-tono-${cuenta.clase}`}
                        style={{ width: `${Math.max(porcentaje, cuenta.cantidad > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button type="button" className="admin-btn admin-btn-suave admin-btn-bloque" onClick={onVerUsuarios}>
              Gestionar cuentas
              <IconoFlecha size={16} />
            </button>
          </section>

          <section className="admin-card" aria-labelledby="admin-accesos-titulo">
            <h2 id="admin-accesos-titulo" className="admin-card-titulo">
              Accesos rápidos
            </h2>
            <div className="admin-accesos">
              <button type="button" className="admin-acceso-rapido" onClick={onVerRestaurantes}>
                <span className="admin-acceso-icono admin-tono-miel">
                  <IconoTienda size={18} />
                </span>
                <span>
                  <strong>Restaurantes</strong>
                  <small>Suspender o activar un local</small>
                </span>
                <IconoFlecha size={15} />
              </button>
              <button type="button" className="admin-acceso-rapido" onClick={onVerUsuarios}>
                <span className="admin-acceso-icono admin-tono-salvia">
                  <IconoUsuarios size={18} />
                </span>
                <span>
                  <strong>Cuentas</strong>
                  <small>Revisar roles y accesos</small>
                </span>
                <IconoFlecha size={15} />
              </button>
              <button type="button" className="admin-acceso-rapido" onClick={onVerAuditoria}>
                <span className="admin-acceso-icono admin-tono-primario">
                  <IconoAuditoria size={18} />
                </span>
                <span>
                  <strong>Auditoría</strong>
                  <small>Buscar y exportar acciones</small>
                </span>
                <IconoFlecha size={15} />
              </button>
            </div>
          </section>
        </div>
      </div>

      <section className="admin-card admin-card-locales" aria-labelledby="admin-locales-titulo">
        <div className="admin-card-cabecera">
          <div>
            <h2 id="admin-locales-titulo" className="admin-card-titulo">
              Locales recientes
            </h2>
            <p className="admin-card-subtitulo">Los últimos restaurantes de la plataforma.</p>
          </div>
          <button type="button" className="admin-enlace" onClick={onVerRestaurantes}>
            Ver todos
            <IconoFlecha size={14} />
          </button>
        </div>

        {localesRecientes.length > 0 ? (
          <ul className="admin-lista-simple">
            {localesRecientes.map((restaurante) => (
              <li key={restaurante.id} className="admin-local-fila">
                <span className="admin-avatar admin-avatar-miel" aria-hidden="true">
                  {iniciales(restaurante.nombre)}
                </span>
                <div className="admin-local-texto">
                  <strong>{restaurante.nombre}</strong>
                  <small>
                    {restaurante.ciudad ?? 'Sin ciudad'}
                    <span aria-hidden="true"> / </span>
                    {restaurante.slug}
                  </small>
                </div>
                <EtiquetaEstado activo={restaurante.activo} />
                <button
                  type="button"
                  className={`admin-btn admin-btn-mini ${restaurante.activo ? 'admin-btn-peligro-suave' : 'admin-btn-exito-suave'}`}
                  onClick={() => onCambiarEstado(restaurante)}
                >
                  {restaurante.activo ? 'Suspender' : 'Activar'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EstadoVacio
            icono={<IconoTienda size={24} />}
            titulo="Todavía no hay locales"
            descripcion="Los restaurantes aparecerán aquí cuando sus dueños publiquen el primero."
            accion={
              <button type="button" className="admin-btn admin-btn-secundario" onClick={onVerRestaurantes}>
                Abrir restaurantes
              </button>
            }
          />
        )}
      </section>
    </div>
  );
};
