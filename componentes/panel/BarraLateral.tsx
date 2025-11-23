
import React from 'react';
import { Store, Palette, UtensilsCrossed, Eye, ExternalLink, LogOut, Share2, PieChart } from 'lucide-react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { ThemeToggle, Logo } from '../ui';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { Restaurante } from '../../tipos';

interface BarraLateralProps {
  tabActiva: 'info' | 'tema' | 'menu' | 'difusion';
  setTabActiva: (tab: 'info' | 'tema' | 'menu' | 'difusion') => void;
  restaurante: Restaurante | null;
  setVistaPreviaAbierta: (abierta: boolean) => void;
  movilAbierto?: boolean;
}

export const BarraLateral: React.FC<BarraLateralProps> = ({ 
  tabActiva, 
  setTabActiva, 
  restaurante, 
  setVistaPreviaAbierta,
  movilAbierto = false
}) => {
  const { user, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
      // Navegar primero para evitar redirección por protección de rutas
      navigate('/');
      // Pequeño delay para permitir que la navegación ocurra antes de limpiar el estado
      setTimeout(async () => {
          await cerrarSesion();
      }, 100);
  };

  // Clases dinámicas para el comportamiento responsive
  const baseClasses = "neumorphic rounded-none border-r border-white/5 flex flex-col fixed md:relative h-full z-40 transition-transform duration-300 ease-in-out bg-bg";
  const mobileClasses = movilAbierto ? "translate-x-0 shadow-2xl w-[85vw]" : "-translate-x-full w-[85vw]";
  const desktopClasses = "md:translate-x-0 md:w-72 md:m-0 md:my-0 md:block";

  return (
    <aside className={`${baseClasses} ${mobileClasses} ${desktopClasses}`}>
      <div className="p-6 flex items-center justify-between border-b border-white/5 h-20 shrink-0">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Logo size={24} />
            </div>
            <span className="font-serif text-xl font-bold text-text-main">SmartFood</span>
        </div>
        {/* Botón cerrar solo visible en móvil */}
        {movilAbierto && (
            <button onClick={() => {}} className="md:hidden text-text-muted">
                {/* El cierre se maneja desde el padre al hacer click fuera o seleccionar opcion */}
            </button>
        )}
      </div>

      <div className="p-6 pb-0">
         <div className="neumorphic-inset p-4 rounded-xl flex items-center gap-3 mb-6">
           <div className="w-10 h-10 rounded-full bg-surface border border-white/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {user?.user_metadata?.nombre?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
           </div>
           <div className="overflow-hidden min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">Bienvenido</p>
              <p className="font-bold text-sm truncate">
                 {(user?.user_metadata?.nombre || user?.user_metadata?.apellido) 
                   ? `${user?.user_metadata?.nombre || ''} ${user?.user_metadata?.apellido || ''}`.trim() 
                   : user?.email?.split('@')[0]}
              </p>
           </div>
         </div>

         <p className="px-2 text-xs font-bold text-text-muted/50 uppercase tracking-wider mb-3">Secciones</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        <button 
          onClick={() => setTabActiva('info')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${tabActiva === 'info' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-text-main'}`}
        >
          <Store size={18} /> Restaurante
        </button>
        <button 
          onClick={() => setTabActiva('menu')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${tabActiva === 'menu' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-text-main'}`}
        >
          <UtensilsCrossed size={18} /> Menú
        </button>
        <button 
          onClick={() => setTabActiva('tema')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${tabActiva === 'tema' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-text-main'}`}
        >
          <Palette size={18} /> Apariencia
        </button>
        <button 
          onClick={() => setTabActiva('difusion')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${tabActiva === 'difusion' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-text-main'}`}
        >
          <Share2 size={18} /> Difusión
        </button>

         <div className="pt-6 mt-6 border-t border-white/5 pb-8">
           <p className="px-2 text-xs font-bold text-text-muted/50 uppercase tracking-wider mb-3">Acciones</p>
           <div className="px-4 mb-2 flex justify-between items-center">
              <span className="text-xs text-text-muted">Tema</span>
              <ThemeToggle />
           </div>
           <button onClick={() => setVistaPreviaAbierta(true)} className="w-full flex items-center gap-3 px-4 py-3 text-text-muted hover:text-text-main hover:bg-white/5 rounded-xl transition-all text-sm">
             <Eye size={18} /> Preview
           </button>
           {restaurante && (
             <a href={`/restaurante/${restaurante.id}`} target="_blank" rel="noreferrer" className="w-full flex items-center gap-3 px-4 py-3 text-text-muted hover:text-text-main hover:bg-white/5 rounded-xl transition-all text-sm">
               <ExternalLink size={18} /> Ir al Sitio
             </a>
           )}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-sm">
             <LogOut size={18} /> Salir
           </button>
         </div>
      </nav>
    </aside>
  );
};
