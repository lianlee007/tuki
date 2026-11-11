import type { Vista } from '../tipos';
import {
  IconoAuditoria,
  IconoPanel,
  IconoSalir,
  IconoTienda,
  IconoUsuarios,
} from './iconos';
import { Marca } from './ui';

const ENLACES: Array<{
  vista: Vista;
  etiqueta: string;
  descripcion: string;
  Icono: typeof IconoPanel;
}> = [
  {
    vista: 'panorama',
    etiqueta: 'Panorama',
    descripcion: 'Resumen de la plataforma',
    Icono: IconoPanel,
  },
  {
    vista: 'restaurantes',
    etiqueta: 'Restaurantes',
    descripcion: 'Locales y publicación',
    Icono: IconoTienda,
  },
  {
    vista: 'usuarios',
    etiqueta: 'Cuentas',
    descripcion: 'Personas y roles',
    Icono: IconoUsuarios,
  },
  {
    vista: 'auditoria',
    etiqueta: 'Auditoría',
    descripcion: 'Historial de acciones',
    Icono: IconoAuditoria,
  },
];

export const NavegacionLateral = ({
  vista,
  onCambiar,
  email,
  onSalir,
}: {
  vista: Vista;
  onCambiar: (vista: Vista) => void;
  email: string;
  onSalir: () => void;
}) => (
  <aside className="admin-sidebar">
    <div className="admin-sidebar-cabecera">
      <Marca />
      <p className="admin-sidebar-lema">El plano de control de TukiTuki.</p>
    </div>

    <nav aria-label="Secciones de administración" className="admin-nav">
      <ul>
        {ENLACES.map(({ vista: destino, etiqueta, descripcion, Icono }) => (
          <li key={destino}>
            <button
              type="button"
              onClick={() => onCambiar(destino)}
              aria-current={vista === destino ? 'page' : undefined}
              className="admin-nav-boton"
            >
              <span className="admin-nav-icono">
                <Icono size={18} />
              </span>
              <span className="admin-nav-texto">
                <span>{etiqueta}</span>
                <small>{descripcion}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>

    <div className="admin-sidebar-pie">
      <div className="admin-cuenta">
        <span className="admin-cuenta-punto" aria-hidden="true" />
        <div className="admin-cuenta-texto">
          <span>Superadministrador</span>
          <small title={email}>{email}</small>
        </div>
      </div>
      <button type="button" className="admin-salir" onClick={onSalir}>
        <IconoSalir size={17} />
        Cerrar sesión
      </button>
    </div>
  </aside>
);

export const NavegacionMovil = ({
  vista,
  onCambiar,
}: {
  vista: Vista;
  onCambiar: (vista: Vista) => void;
}) => (
  <nav aria-label="Secciones de administración" className="admin-nav-movil">
    {ENLACES.map(({ vista: destino, etiqueta, Icono }) => (
      <button
        key={destino}
        type="button"
        onClick={() => onCambiar(destino)}
        aria-current={vista === destino ? 'page' : undefined}
        className="admin-nav-movil-boton"
      >
        <Icono size={20} />
        <span>{etiqueta}</span>
      </button>
    ))}
  </nav>
);
