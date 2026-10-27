import React from 'react';
import {
  Store, UtensilsCrossed, Eye, ExternalLink, LogOut, Share2,
  PanelLeftClose, ChevronRight, X, MessageSquare, ReceiptText,
} from 'lucide-react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { ThemeToggle, Logo, MarcaTuki } from '../ui';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { Restaurante } from '../../tipos';
import { generarSlugUnico } from '../../lib/utils';

type TabPanel = 'info' | 'tema' | 'menu' | 'pedidos' | 'difusion' | 'resenas';

interface BarraLateralProps {
  tabActiva: TabPanel;
  setTabActiva: (tab: TabPanel) => void;
  restaurante: Restaurante | null;
  setVistaPreviaAbierta: (abierta: boolean) => void;
  movilAbierto?: boolean;
  /** En escritorio la barra se pliega a un raíl de iconos. */
  contraido: boolean;
  onAlternarContraido: () => void;
  /** Cierra el cajón en móvil. */
  onCerrarMovil?: () => void;
}

export const BarraLateral: React.FC<BarraLateralProps> = ({
  tabActiva,
  setTabActiva,
  restaurante,
  setVistaPreviaAbierta,
  movilAbierto = false,
  contraido,
  onAlternarContraido,
  onCerrarMovil,
}) => {
  const { user, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await cerrarSesion();
    navigate('/');
  };

  const navItems: { id: TabPanel; icon: React.ReactNode; label: string }[] = [
    { id: 'info', icon: <Store size={18} />, label: 'Restaurante' },
    { id: 'menu', icon: <UtensilsCrossed size={18} />, label: 'Menú' },
    { id: 'pedidos', icon: <ReceiptText size={18} />, label: 'Pedidos' },
    { id: 'resenas', icon: <MessageSquare size={18} />, label: 'Reseñas' },
    { id: 'tema', icon: <Eye size={18} />, label: 'Apariencia' },
    { id: 'difusion', icon: <Share2 size={18} />, label: 'Difusión' },
  ];

  const inicial =
    user?.user_metadata?.nombre?.charAt(0).toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    '·';
  const nombreUsuario = (user?.user_metadata?.nombre || user?.user_metadata?.apellido)
    ? `${user?.user_metadata?.nombre || ''} ${user?.user_metadata?.apellido || ''}`.trim()
    : user?.email?.split('@')[0] || 'Tu cuenta';

  /* En el raíl plegado todo se centra. Hay dos formas de ocultar una etiqueta:
     `etiqueta` la quita y libera su hueco (lo que necesitan los iconos), y
     `etiquetaFija` la deja invisible pero conserva su altura y sus márgenes, para
     que los bloques guarden el mismo aire que desplegada. En móvil el cajón
     siempre se ve completo (las clases `md:` sólo actúan en escritorio). */
  const centrar = contraido ? 'md:justify-center md:px-0' : '';
  const etiqueta = contraido ? 'md:hidden' : '';
  const etiquetaFija = contraido ? 'md:opacity-0' : '';
  const fila = `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm outline-none transition-colors duration-200 ${centrar}`;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[85vw] flex-col border-r border-af/20 bg-af-surface shadow-xl transition-[transform,width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:relative md:shadow-none ${
        contraido ? 'md:w-[76px]' : 'md:w-72'
      } ${movilAbierto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      {/* Cabecera: marca + plegar/desplegar */}
      <div
        className={`flex h-20 shrink-0 items-center justify-between border-b border-af/30 px-6 ${
          contraido ? 'md:justify-center md:px-2' : ''
        }`}
      >
        {/* Plegada (escritorio): el logo lleva una flecha pegada que delata que
            se puede pulsar para desplegar. Sin ella el dibujo parecía decoración. */}
        {contraido && (
          <button
            type="button"
            onClick={onAlternarContraido}
            title="Desplegar el menú"
            aria-label="Desplegar el menú"
            aria-expanded={false}
            className="relative hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-af-accent-solid text-white outline-none transition-opacity hover:opacity-90 md:flex"
          >
            <Logo size={22} />
            <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-af-ground text-af-ink ring-1 ring-af/25">
              <ChevronRight size={13} strokeWidth={3} />
            </span>
          </button>
        )}

        <div className={`flex min-w-0 items-center ${etiqueta}`}>
          <MarcaTuki tamano={22} />
        </div>

        {/* Desplegada: botón con nombre para plegar (escritorio). En móvil, cerrar. */}
        {!contraido && (
          <button
            type="button"
            onClick={onAlternarContraido}
            title="Contraer el menú"
            aria-label="Contraer el menú"
            aria-expanded
            className="hidden h-9 shrink-0 items-center gap-2 rounded-lg bg-af-ink/[0.06] px-3 text-xs font-semibold text-af-ink-secondary outline-none transition-colors hover:bg-af-ink/[0.1] hover:text-af-ink md:flex dark:bg-white/[0.1] dark:hover:bg-white/[0.16]"
          >
            <PanelLeftClose size={16} />
            Contraer
          </button>
        )}
        {onCerrarMovil && (
          <button
            type="button"
            onClick={onCerrarMovil}
            title="Cerrar el menú"
            aria-label="Cerrar el menú"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-af-ink-secondary outline-none transition-colors hover:bg-af-ink/[0.06] hover:text-af-ink md:hidden dark:hover:bg-white/[0.08]"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Cuenta */}
      <div className={`px-6 pt-6 ${contraido ? 'md:px-2' : ''}`}>
        <div className={`flex items-center gap-3 ${contraido ? 'md:justify-center' : ''}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-af-accent/10 text-sm font-bold text-af-accent-text">
            {inicial}
          </div>
          <div className={`min-w-0 overflow-hidden ${etiqueta}`}>
            <p className="truncate text-sm font-semibold text-af-ink">{nombreUsuario}</p>
            <p className="truncate text-xs text-af-ink-secondary">{user?.email}</p>
          </div>
        </div>

        <p className={`mb-3 mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-af-ink-secondary/70 ${etiquetaFija}`}>
          Panel
        </p>
      </div>

      <nav className={`flex-1 space-y-1 overflow-y-auto pb-2 ${contraido ? 'md:px-2' : 'px-4'}`}>
        {navItems.map((item) => {
          const isActive = tabActiva === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTabActiva(item.id)}
              title={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`${fila} font-medium ${
                isActive
                  ? 'bg-af-accent text-white'
                  : 'text-af-ink-secondary hover:bg-af-ink/[0.06] hover:text-af-accent-text dark:hover:bg-white/[0.08]'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={`truncate font-medium ${etiqueta}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Acciones */}
      <div className={`border-t border-af/30 px-4 pb-6 pt-5 ${contraido ? 'md:px-2' : ''}`}>
        <p className={`mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-af-ink-secondary/70 ${etiquetaFija}`}>
          Ajustes
        </p>

        <div className={`mb-1 flex items-center justify-between px-2 ${contraido ? 'md:justify-center md:px-0' : ''}`}>
          <span className={`text-sm text-af-ink-secondary ${etiqueta}`}>Tema</span>
          <ThemeToggle />
        </div>

        <button
          type="button"
          onClick={() => setVistaPreviaAbierta(true)}
          title="Vista previa"
          className={`${fila} text-af-ink-secondary hover:bg-af-ink/[0.06] hover:text-af-ink dark:hover:bg-white/[0.08]`}
        >
          <Eye size={18} className="shrink-0" />
          <span className={`truncate ${etiqueta}`}>Vista previa</span>
        </button>

        {restaurante && (
          <a
            href={`/restaurante/${generarSlugUnico(restaurante.nombre, restaurante.id)}`}
            target="_blank"
            rel="noreferrer"
            title="Ir al sitio"
            className={`${fila} text-af-ink-secondary hover:bg-af-ink/[0.06] hover:text-af-ink dark:hover:bg-white/[0.08]`}
          >
            <ExternalLink size={18} className="shrink-0" />
            <span className={`truncate ${etiqueta}`}>Ir al sitio</span>
          </a>
        )}

        <button
          type="button"
          onClick={handleLogout}
          title="Cerrar sesión"
          className={`${fila} text-af-danger-text hover:bg-af-danger/10`}
        >
          <LogOut size={18} className="shrink-0" />
          <span className={`truncate ${etiqueta}`}>Salir</span>
        </button>
      </div>
    </aside>
  );
};
