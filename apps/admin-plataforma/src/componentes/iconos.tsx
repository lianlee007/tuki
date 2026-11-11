import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & { size?: number };

const Icono = ({ size = 18, children, ...props }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    {children}
  </svg>
);

export const IconoPanel = (props: Props) => (
  <Icono {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Icono>
);

export const IconoTienda = (props: Props) => (
  <Icono {...props}>
    <path d="M4 10v10h16V10" />
    <path d="M3 6.5 5 3h14l2 3.5a2.5 2.5 0 0 1-4.6 1.4A2.5 2.5 0 0 1 12 8a2.5 2.5 0 0 1-4.4 1.9A2.5 2.5 0 0 1 3 6.5Z" />
    <path d="M9 20v-5h6v5" />
  </Icono>
);

export const IconoUsuarios = (props: Props) => (
  <Icono {...props}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.5a3 3 0 0 1 0 5.8" />
    <path d="M17.5 14.2A5.5 5.5 0 0 1 21 19.2" />
  </Icono>
);

export const IconoAuditoria = (props: Props) => (
  <Icono {...props}>
    <path d="M9 4h9a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9" />
    <path d="M3 8h9M3 12h9M3 16h5" />
    <path d="m15 9 1.6 1.6L19.5 7.5" />
  </Icono>
);

export const IconoBuscar = (props: Props) => (
  <Icono {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Icono>
);

export const IconoRefrescar = (props: Props) => (
  <Icono {...props}>
    <path d="M20 11a8 8 0 1 0-2.3 5.7" />
    <path d="M20 4v7h-7" />
  </Icono>
);

export const IconoSol = (props: Props) => (
  <Icono {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icono>
);

export const IconoLuna = (props: Props) => (
  <Icono {...props}>
    <path d="M20 14.3A8 8 0 0 1 9.7 4a8 8 0 1 0 10.3 10.3Z" />
  </Icono>
);

export const IconoSalir = (props: Props) => (
  <Icono {...props}>
    <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
    <path d="m14 8 4 4-4 4M18 12H8" />
  </Icono>
);

export const IconoEscudo = (props: Props) => (
  <Icono {...props}>
    <path d="M12 3 4.5 6v5.5c0 4.3 2.9 7.8 7.5 9.5 4.6-1.7 7.5-5.2 7.5-9.5V6L12 3Z" />
    <path d="m9 12 2 2 4-4" />
  </Icono>
);

export const IconoFlecha = (props: Props) => (
  <Icono {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icono>
);

export const IconoCheck = (props: Props) => (
  <Icono {...props}>
    <path d="m5 12 4.5 4.5L19 6.5" />
  </Icono>
);

export const IconoCerrar = (props: Props) => (
  <Icono {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icono>
);

export const IconoAlerta = (props: Props) => (
  <Icono {...props}>
    <path d="M12 3.5 2.8 20h18.4L12 3.5Z" />
    <path d="M12 9v5M12 17.4v.1" />
  </Icono>
);

export const IconoReloj = (props: Props) => (
  <Icono {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icono>
);

export const IconoActividad = (props: Props) => (
  <Icono {...props}>
    <path d="M3 12h4l2.5-7 4 14 2.5-7h5" />
  </Icono>
);

export const IconoDinero = (props: Props) => (
  <Icono {...props}>
    <rect x="3" y="6" width="18" height="12" rx="2.5" />
    <path d="M3 10h18" />
    <path d="M16.5 14.5h1" />
  </Icono>
);

export const IconoPedido = (props: Props) => (
  <Icono {...props}>
    <path d="M6 3h12a1 1 0 0 1 1 1v17l-3-2-2 2-2-2-2 2-3-2V4a1 1 0 0 1 1-1Z" />
    <path d="M9 8h6M9 12h6" />
  </Icono>
);

export const IconoDescargar = (props: Props) => (
  <Icono {...props}>
    <path d="M12 3v11" />
    <path d="m8 10 4 4 4-4" />
    <path d="M4 17v3h16v-3" />
  </Icono>
);

export const IconoCopiar = (props: Props) => (
  <Icono {...props}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
  </Icono>
);

export const IconoOjo = (props: Props) => (
  <Icono {...props}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icono>
);

export const IconoOjoCerrado = (props: Props) => (
  <Icono {...props}>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-3.2 3.8" />
    <path d="M6.1 7.4A15.7 15.7 0 0 0 2.5 12S6 18 12 18a9.6 9.6 0 0 0 4-.9" />
  </Icono>
);

export const IconoCorreo = (props: Props) => (
  <Icono {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </Icono>
);

export const IconoCandado = (props: Props) => (
  <Icono {...props}>
    <rect x="4.5" y="10" width="15" height="11" rx="2.5" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
  </Icono>
);

export const IconoFlechaIzquierda = (props: Props) => (
  <Icono {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icono>
);

export const IconoFiltro = (props: Props) => (
  <Icono {...props}>
    <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />
  </Icono>
);
