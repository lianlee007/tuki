/**
 * Superficie pública de la experiencia heredada de TukiTuki.
 *
 * Los tres frontends importan de aquí las páginas y proveedores que necesitan;
 * así comparten el diseño y el comportamiento originales sin duplicar código.
 */
export { default as PaginaDescubrir } from './paginas/PaginaDescubrir';
export { default as PaginaInspiracion } from './paginas/PaginaInspiracion';
export { default as PaginaParaRestaurantes } from './paginas/PaginaParaRestaurantes';
export { default as PaginaAutenticacion } from './paginas/PaginaAutenticacion';
export { default as PaginaEntrar } from './paginas/PaginaEntrar';
export { default as PaginaMiCuenta } from './paginas/PaginaMiCuenta';
export { default as PaginaTerminos } from './paginas/PaginaTerminos';
export { default as PaginaPrivacidad } from './paginas/PaginaPrivacidad';
export { default as PaginaQR } from './paginas/PaginaQR';
export { default as Pagina404 } from './paginas/Pagina404';
export { default as PanelControl } from './paginas/PanelControl';
export { default as VistaPublica } from './paginas/VistaPublica';

export {
  ProveedorAutenticacion,
  useAuth,
  type UsuarioHeredado,
  type Rol,
} from './contexto/ContextoAutenticacion';
export { ProveedorTema } from './contexto/ContextoTema';
export { SincronizacionCarrito } from './componentes/SincronizacionCarrito';
export { ChatRecomendador } from './componentes/chat/ChatRecomendador';
export { ErrorBoundary } from './componentes/sistema-diseno/ErrorBoundary';
export { TransicionPagina } from './componentes/sistema-diseno/TransicionPagina';
export { RutaAuth, RutaConSesion, RutaPanel } from './componentes/rutas/RutasProtegidas';
export { Logo } from './componentes/ui';
export { apiDescubrir } from './api/apiDescubrir';
export { apis } from './lib/api-tuki';
