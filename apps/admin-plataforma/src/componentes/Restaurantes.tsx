import type { RestauranteAdmin } from '@tuki/api-cliente';
import {
  acortarId,
  formatearFechaCorta,
  formatearNumero,
  iniciales,
} from '../lib/formato';
import {
  IconoCopiar,
  IconoFiltro,
  IconoFlecha,
  IconoTienda,
} from './iconos';
import { EtiquetaEstado, EstadoVacio } from './ui';

export type FiltroRestaurantes = 'todos' | 'activos' | 'suspendidos';

const FILTROS: Array<{ valor: FiltroRestaurantes; etiqueta: string }> = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'activos', etiqueta: 'Activos' },
  { valor: 'suspendidos', etiqueta: 'Suspendidos' },
];

export const Restaurantes = ({
  restaurantes,
  total,
  busqueda,
  filtro,
  cargando,
  onFiltro,
  onLimpiarBusqueda,
  onCambiarEstado,
  onCopiarId,
  onVerLocal,
}: {
  restaurantes: RestauranteAdmin[];
  total: number;
  busqueda: string;
  filtro: FiltroRestaurantes;
  cargando: boolean;
  onFiltro: (filtro: FiltroRestaurantes) => void;
  onLimpiarBusqueda: () => void;
  onCambiarEstado: (restaurante: RestauranteAdmin) => void;
  onCopiarId: (id: string) => void;
  onVerLocal: (restaurante: RestauranteAdmin) => void;
}) => {
  const visibles = restaurantes.filter((restaurante) => {
    if (filtro === 'activos') return restaurante.activo;
    if (filtro === 'suspendidos') return !restaurante.activo;
    return true;
  });

  const activos = restaurantes.filter((restaurante) => restaurante.activo).length;

  return (
    <section aria-labelledby="admin-restaurantes-titulo">
      <div className="admin-seccion-cabecera">
        <div>
          <h2 id="admin-restaurantes-titulo" className="admin-seccion-titulo">
            Directorio de restaurantes
          </h2>
          <p className="admin-seccion-subtitulo">
            {formatearNumero(visibles.length)} visibles de {formatearNumero(total)} resultados.
            {activos > 0 ? ` ${formatearNumero(activos)} están activos en esta vista.` : ''}
          </p>
        </div>
      </div>

      <div className="admin-herramientas">
        <div className="admin-segmentos" role="group" aria-label="Filtrar restaurantes por estado">
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
        <p className="admin-herramientas-nota">
          <IconoFiltro size={14} />
          {busqueda ? `Filtrado por «${busqueda}»` : 'Busca por nombre o ciudad desde la barra superior'}
        </p>
      </div>

      {cargando ? (
        <div className="admin-lista-cargando" aria-busy="true" aria-label="Cargando restaurantes">
          {[0, 1, 2].map((indice) => (
            <div key={indice} className="admin-esqueleto-fila" />
          ))}
        </div>
      ) : visibles.length > 0 ? (
        <ul className="admin-lista">
          {visibles.map((restaurante) => (
            <li key={restaurante.id} className="admin-fila">
              <span className="admin-avatar admin-avatar-miel" aria-hidden="true">
                {iniciales(restaurante.nombre)}
              </span>

              <div className="admin-fila-principal">
                <div className="admin-fila-titulo">
                  <strong title={restaurante.nombre}>{restaurante.nombre}</strong>
                  <EtiquetaEstado activo={restaurante.activo} />
                </div>
                <p className="admin-fila-detalle">
                  <span>{restaurante.ciudad ?? 'Sin ciudad'}</span>
                  <span>{restaurante.departamento ?? 'Sin departamento'}</span>
                  <span>Creado el {formatearFechaCorta(restaurante.creadoEn)}</span>
                </p>
                <p className="admin-fila-id">
                  Dueño {acortarId(restaurante.duenoId)}
                  <span aria-hidden="true"> / </span>
                  {restaurante.slug}
                </p>
              </div>

              <div className="admin-fila-acciones">
                <button
                  type="button"
                  className="admin-btn admin-btn-mini admin-btn-secundario"
                  onClick={() => onVerLocal(restaurante)}
                >
                  Ver ficha
                  <IconoFlecha size={14} />
                </button>
                <button
                  type="button"
                  className={`admin-btn admin-btn-mini ${restaurante.activo ? 'admin-btn-peligro-suave' : 'admin-btn-exito-suave'}`}
                  onClick={() => onCambiarEstado(restaurante)}
                >
                  {restaurante.activo ? 'Suspender' : 'Activar'}
                </button>
                <button
                  type="button"
                  className="admin-boton-icono admin-boton-icono-borde"
                  aria-label={`Copiar el identificador de ${restaurante.nombre}`}
                  title="Copiar identificador"
                  onClick={() => onCopiarId(restaurante.id)}
                >
                  <IconoCopiar size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="admin-card">
          <EstadoVacio
            icono={<IconoTienda size={26} />}
            titulo={busqueda ? 'Sin coincidencias' : 'No hay restaurantes en esta vista'}
            descripcion={
              busqueda
                ? `No encontramos un local que coincida con «${busqueda}». Prueba con el nombre de la ciudad o del restaurante.`
                : filtro === 'suspendidos'
                  ? 'Todos los locales cargados están activos. Buenas noticias.'
                  : 'Cuando un dueño publique su restaurante, aparecerá en este directorio.'
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
