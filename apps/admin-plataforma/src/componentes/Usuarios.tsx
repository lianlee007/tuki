import type { Rol, Usuario } from '@tuki/dominio';
import {
  formatearFechaCorta,
  formatearNumero,
  iniciales,
  nombreCompleto,
} from '../lib/formato';
import { IconoCheck, IconoFiltro, IconoUsuarios } from './iconos';
import { EstadoVacio } from './ui';

export type FiltroUsuarios = 'todos' | Rol;

const FILTROS: Array<{ valor: FiltroUsuarios; etiqueta: string }> = [
  { valor: 'todos', etiqueta: 'Todas' },
  { valor: 'cliente', etiqueta: 'Comensales' },
  { valor: 'dueno', etiqueta: 'Dueños' },
  { valor: 'superadmin', etiqueta: 'Superadmins' },
];

const tonoDe = (rol: Rol): 'primario' | 'miel' | 'salvia' => {
  if (rol === 'dueno') return 'miel';
  if (rol === 'superadmin') return 'salvia';
  return 'primario';
};

export const Usuarios = ({
  usuarios,
  total,
  busqueda,
  filtro,
  cargando,
  usuarioActualId,
  onFiltro,
  onLimpiarBusqueda,
  onSolicitarRol,
}: {
  usuarios: Usuario[];
  total: number;
  busqueda: string;
  filtro: FiltroUsuarios;
  cargando: boolean;
  usuarioActualId?: string;
  onFiltro: (filtro: FiltroUsuarios) => void;
  onLimpiarBusqueda: () => void;
  onSolicitarRol: (usuario: Usuario, rol: Rol) => void;
}) => {
  const visibles = usuarios.filter((usuario) => (filtro === 'todos' ? true : usuario.rol === filtro));

  return (
    <section aria-labelledby="admin-usuarios-titulo">
      <div className="admin-seccion-cabecera">
        <div>
          <h2 id="admin-usuarios-titulo" className="admin-seccion-titulo">
            Personas y permisos
          </h2>
          <p className="admin-seccion-subtitulo">
            {formatearNumero(visibles.length)} visibles de {formatearNumero(total)} resultados.
            Los cambios de rol quedan auditados.
          </p>
        </div>
      </div>

      <div className="admin-herramientas">
        <div className="admin-segmentos" role="group" aria-label="Filtrar cuentas por rol">
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
          {busqueda ? `Filtrado por «${busqueda}»` : 'Busca por correo o nombre desde la barra superior'}
        </p>
      </div>

      {cargando ? (
        <div className="admin-lista-cargando" aria-busy="true" aria-label="Cargando cuentas">
          {[0, 1, 2].map((indice) => (
            <div key={indice} className="admin-esqueleto-fila" />
          ))}
        </div>
      ) : visibles.length > 0 ? (
        <ul className="admin-lista">
          {visibles.map((usuario) => {
            const esMiCuenta = usuario.id === usuarioActualId;
            return (
              <li key={usuario.id} className="admin-fila">
                <span className={`admin-avatar admin-avatar-${tonoDe(usuario.rol)}`} aria-hidden="true">
                  {iniciales(usuario.nombre, usuario.apellido)}
                </span>

                <div className="admin-fila-principal">
                  <div className="admin-fila-titulo">
                    <strong title={nombreCompleto(usuario.nombre, usuario.apellido)}>
                      {nombreCompleto(usuario.nombre, usuario.apellido)}
                    </strong>
                    {esMiCuenta ? <span className="admin-pill admin-pill-neutro">Tu cuenta</span> : null}
                  </div>
                  <p className="admin-fila-correo" title={usuario.email}>
                    {usuario.email}
                  </p>
                  <p className="admin-fila-detalle">
                    <span className="admin-verificado">
                      {usuario.emailVerificado ? (
                        <>
                          <IconoCheck size={13} />
                          Correo verificado
                        </>
                      ) : (
                        'Correo sin verificar'
                      )}
                    </span>
                    <span>Registro: {formatearFechaCorta(usuario.creadoEn)}</span>
                    <span>ID {usuario.id.slice(0, 8)}…</span>
                  </p>
                </div>

                <div className="admin-fila-acciones admin-fila-rol">
                  <label className="admin-select-rol">
                    <span>Rol</span>
                    <select
                      value={usuario.rol}
                      onChange={(evento) => {
                        const nuevo = evento.target.value as Rol;
                        if (nuevo !== usuario.rol) onSolicitarRol(usuario, nuevo);
                      }}
                      disabled={esMiCuenta}
                      aria-label={`Cambiar el rol de ${nombreCompleto(usuario.nombre, usuario.apellido)}`}
                      title={esMiCuenta ? 'No puedes cambiar tu propio rol' : undefined}
                    >
                      <option value="cliente">Comensal</option>
                      <option value="dueno">Dueño de restaurante</option>
                      <option value="superadmin">Superadministrador</option>
                    </select>
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="admin-card">
          <EstadoVacio
            icono={<IconoUsuarios size={26} />}
            titulo={busqueda ? 'Sin coincidencias' : 'No hay cuentas en esta vista'}
            descripcion={
              busqueda
                ? `Ninguna cuenta coincide con «${busqueda}». Prueba con el correo completo o parte del nombre.`
                : 'Cambia el filtro para ver otros roles de la plataforma.'
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
