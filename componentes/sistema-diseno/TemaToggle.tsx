
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTema } from '../../contexto/ContextoTema';

export const ThemeToggle: React.FC = () => {
  const { tema, toggleTema } = useTema();
  const isDark = tema === 'dark';

  return (
    <button
      onClick={toggleTema}
      aria-label="Alternar tema"
      className="relative outline-none group"
    >
      {/* Track del Toggle */}
      <div
        className="w-16 h-9 rounded-full transition-all duration-500 ease-out"
        style={{
          background: isDark ? 'var(--bg-color)' : '#E8DCC8', // Fondo más oscuro en light mode para contraste
          boxShadow: isDark
            ? 'inset 6px 6px 12px var(--shadow-dark), inset -6px -6px 12px var(--shadow-light)'
            : 'inset 2px 2px 5px rgba(44, 36, 22, 0.1), inset -2px -2px 5px rgba(255, 255, 255, 0.5)',
          border: isDark
            ? 'none'
            : '1px solid var(--border-primary)'
        }}
      >
        {/* Bordes internos para modo oscuro (profundidad extra) */}
        {isDark && (
          <div className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              borderBottom: '1px solid var(--border-highlight)',
              borderRight: '1px solid var(--border-highlight)',
              borderTop: '1px solid var(--border-shadow)',
              borderLeft: '1px solid var(--border-shadow)',
              opacity: 0.5
            }}
          />
        )}
      </div>

      {/* Iconos de fondo */}
      <div className="absolute inset-0 flex justify-between items-center px-2.5 pointer-events-none">
        <Sun size={14} className={`transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-60 text-amber-700'}`} />
        <Moon size={14} className={`transition-opacity duration-300 ${isDark ? 'opacity-60 text-indigo-300' : 'opacity-0'}`} />
      </div>

      {/* Thumb (Círculo móvil) */}
      <div
        className={`
          absolute top-1 left-1 w-7 h-7 rounded-full flex items-center justify-center
          transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
          ${isDark ? 'translate-x-7' : 'translate-x-0'}
        `}
        style={{
          background: isDark ? 'var(--bg-color)' : '#FFFFFF',
          color: isDark ? 'var(--user-primary)' : '#F59E0B',
          boxShadow: isDark
            ? '6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light), inset 1px 1px 0px var(--border-highlight), inset -1px -1px 0px var(--border-shadow)'
            : '2px 2px 5px rgba(44, 36, 22, 0.15), -1px -1px 3px rgba(255, 255, 255, 0.8)',
          border: isDark ? 'none' : '1px solid var(--border-primary)'
        }}
      >
        <div className={`transition-transform duration-700 ${isDark ? 'rotate-[360deg]' : 'rotate-0'}`}>
          {isDark ? (
            <Moon size={14} fill="currentColor" className="drop-shadow-[0_0_5px_rgba(234,88,12,0.5)]" />
          ) : (
            <Sun size={14} fill="currentColor" />
          )}
        </div>
      </div>
    </button>
  );
};
