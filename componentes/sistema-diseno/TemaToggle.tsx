
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
      <div
        className="w-16 h-9 rounded-2xl transition-colors duration-300"
        style={{
          background: 'var(--bg-color)',
          boxShadow: isDark
            ? 'inset 5px 5px 10px var(--shadow-dark), inset -5px -5px 10px var(--shadow-light)'
            : 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)',
          borderBottom: '1px solid var(--border-highlight)',
          borderRight: '1px solid var(--border-highlight)',
          borderTop: '1px solid var(--border-shadow)',
          borderLeft: '1px solid var(--border-shadow)'
        }}
      ></div>

      <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none opacity-40">
        <Sun size={14} className="text-text-muted" />
        <Moon size={14} className="text-text-muted" />
      </div>

      <div
        className={`
          absolute top-1 left-1 w-7 h-7 rounded-xl flex items-center justify-center
          transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
          ${isDark ? 'translate-x-7 text-primary' : 'translate-x-0 text-yellow-600'}
        `}
        style={{
          background: 'var(--bg-color)',
          boxShadow: isDark
            ? '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light), inset 1px 1px 0px var(--border-highlight), inset -1px -1px 0px var(--border-shadow)'
            : '3px 3px 5px var(--shadow-dark), -2px -2px 5px var(--shadow-light)',
          borderTop: isDark ? 'none' : '1px solid var(--border-highlight)',
          borderLeft: isDark ? 'none' : '1px solid var(--border-highlight)',
          ...(isDark ? {} : { border: '1px solid #D4C4B0' })
        }}
      >
        <div className={`transition-transform duration-500 ${isDark ? 'rotate-0' : '-rotate-180'}`}>
          {isDark ? <Moon size={14} fill="currentColor" /> : <Sun size={14} fill="currentColor" />}
        </div>
      </div>
    </button>
  );
};
