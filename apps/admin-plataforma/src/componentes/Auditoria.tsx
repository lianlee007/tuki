import type { Auditoria as Evento } from '@tuki/api-cliente';
import {
  acortarId,
  describirAccion,
  ETIQUETAS_ENTIDAD,
  formatearFecha,
  formatearNumero,
  formatearRelativo,
  valorLegible,
} from '../lib/formato';
import {
  IconoActividad,
  IconoAuditoria,
  IconoDescargar,
  IconoFiltro,
  IconoTienda,
  IconoUsuarios,
} from './iconos';
import { EstadoVacio } from './ui';

export type FiltroAuditoria = 'todos' | 'restaurante' | 'usuario';

const FILTROS: Array<{ valor: FiltroAuditoria; etiqueta: string }> = [
  { valor: 'todos', etiqueta: 'Todo' },
  { valor: 'restaurante', etiqueta: 'Restaurantes' },
  { valor: 'usuario', etiqueta: 'Cuentas' },
];

const iconoDe = (entidad: string) => {
  if (entidad === 'restaurante') return <IconoTienda size={15} />;
  if (entidad === 'usuario') return <IconoUsuarios size={15} />;
  return <IconoActividad size={15} />;
};

export const Auditoria = ({
  eventos,
  busqueda,
  filtro,
  onFiltro,
  onLimpiarBusqueda,
  onExportar,
}: {
  eventos: Evento[];
  busqueda: string;
  filtro: FiltroAuditoria;
  onFiltro: (filtro: FiltroAuditoria) => void;
  onLimpiarBusqueda: () => void;
  onExportar: () => void;
}) => {
  const visibles = eventos.filter((evento) => (filtro === 'todos' ? true : evento.entidad === filtro));

  return (
    <section aria-labelledby="admin-auditoria-titulo">
      <div className="admin-seccion-cabecera">
        <div>
          <h2 id="admin-auditoria-titulo" className="admin-seccion-titulo">
            Historial de acciones
          </h2>
          <p className="admin-seccion-subtitulo">
            Cada cambio sensible deja rastro. Se conservan las últimas 100 acciones.
          </p>
        </div>
        <button type="button" className="admin-btn admin-btn-secundario" onClick={onExportar}>
          <IconoDescargar size={16} />
          Exportar CSV
        </button>
      </div>

      <div className="admin-herramientas">
        <div className="admin-segmentos" role="group" aria-label="Filtrar auditoría por entidad">
          {FILTROS.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => onFiltro(opcion.valor)}
              aria-pressed={filtro === opcion.valor}
              className="admin-segmento"
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>
        <p className="admin-herramientas-nota" aria-live="polite">
          <IconoFiltro size={14} />
          {formatearNumero(visibles.length)} de {formatearNumero(eventos.length)} eventos
          {busqueda ? ` para «${busqueda}»` : ''}
        </p>
      </div>

      {visibles.length > 0 ? (
        <div className="admin-card admin-card-auditoria">
          <ol className="admin-timeline admin-timeline-completa">
            {visibles.map((evento) => (
              <li key={evento.id}>
                <span className="admin-timeline-punto">{iconoDe(evento.entidad)}</span>
                <div className="admin-timeline-texto">
                  <div className="admin-timeline-cabecera">
                    <p>
                      <strong>{describirAccion(evento.accion)}</strong>
                      <span className="admin-timeline-entidad">
                        {ETIQUETAS_ENTIDAD[evento.entidad] ?? evento.entidad}
                      </span>
                    </p>
                    <time dateTime={evento.creadoEn} title={formatearFecha(evento.creadoEn)}>
                      {formatearRelativo(evento.creadoEn)}
                    </time>
                  </div>

                  <p className="admin-timeline-meta">
                    <span>Entidad {acortarId(evento.entidadId)}</span>
                    <span>Actor {acortarId(evento.actorId)}</span>
                    <span>{formatearFecha(evento.creadoEn)}</span>
                  </p>

                  <div className="admin-timeline-pie">
                    <code className="admin-codigo-accion">{evento.accion}</code>
                    {Object.entries(evento.detalle)
                      .slice(0, 3)
                      .map(([clave, valor]) => (
                        <span key={clave} className="admin-detalle-chip">
                          {clave}: {valorLegible(valor)}
                        </span>
                      ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="admin-card">
          <EstadoVacio
            icono={<IconoAuditoria size={26} />}
            titulo={busqueda ? 'Sin resultados en la auditoría' : 'Aún no hay acciones registradas'}
            descripcion={
              busqueda
                ? `No hay eventos que coincidan con «${busqueda}». Busca por acción, entidad o identificador.`
                : 'Cuando el equipo active un local o cambie un rol, la acción aparecerá aquí con fecha y responsable.'
            }
            accion={
              busqueda ? (
                <button type="button" className="admin-btn admin-btn-secundario" onClick={onLimpiarBusqueda}>
                  Limpiar la búsqueda
                </button>
              ) : undefined
            }
          />
        </div>
      )}
    </section>
  );
};
