/** Preset de Tailwind heredado del Tuki original. */
const preset = {
      darkMode: 'class',
      /* En pantalla táctil `:hover` se queda pegado después de tocar. Con esto
         los estilos de hover solo se generan donde hay puntero que flota. */
      future: { hoverOnlyWhenSupported: true },
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            serif: ['Playfair Display', 'serif'],
            /* «Warm Culinary Hearth»: la voz de Descubrir y de la portada. */
            jakarta: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
          },
          boxShadow: {
            /* Elevación cálida: la sombra nunca es gris, está teñida de terracota. */
            warm: '0 8px 24px -4px rgba(135, 78, 56, 0.07), 0 2px 6px -1px rgba(135, 78, 56, 0.04)',
            'warm-lg': '0 14px 32px -6px rgba(135, 78, 56, 0.12), 0 4px 10px -2px rgba(135, 78, 56, 0.06)',
            'warm-xl': '0 20px 48px -8px rgba(78, 42, 29, 0.16)',
            'warm-subtle': '0 2px 10px rgba(163, 143, 134, 0.08)',
            'warm-dark': '0 8px 24px -6px rgba(0, 0, 0, 0.45), 0 2px 6px -1px rgba(0, 0, 0, 0.3)',
          },
          borderRadius: {
            '4xl': '1.75rem',
          },
          colors: {
            bg: 'var(--bg-color)',
            surface: 'var(--surface-color)',
            primary: '#EA580C',  /* Naranja Intenso */
            secondary: '#10B981', /* Verde Esmeralda Vibrante */
            accent: '#FCA311',
            text: {
              main: 'var(--text-main)',
              muted: 'var(--text-muted)'
            },
            /* Tokens semánticos del sistema (respaldados por variables CSS, con
               soporte de opacidad). Una plantilla de restaurante redefine los
               canales r g b y todo el árbol hereda su paleta. */
            af: {
              DEFAULT: 'rgb(var(--af-border-rgb) / <alpha-value>)',
              ground: 'rgb(var(--af-ground-rgb) / <alpha-value>)',
              surface: 'rgb(var(--af-surface-rgb) / <alpha-value>)',
              ink: 'rgb(var(--af-ink-rgb) / <alpha-value>)',
              'ink-secondary': 'rgb(var(--af-ink-secondary-rgb) / <alpha-value>)',
              accent: 'rgb(var(--af-accent-rgb) / <alpha-value>)',
              'accent-text': 'rgb(var(--af-accent-text-rgb) / <alpha-value>)',
              'accent-solid': 'rgb(var(--af-accent-solid-rgb) / <alpha-value>)',
              'accent-soft': 'rgb(var(--af-accent-soft-rgb) / <alpha-value>)',
              'accent-hover': 'rgb(var(--af-accent-hover-rgb) / <alpha-value>)',
              /* El APOYO de la paleta. La marca va en las acciones; el apoyo en
                 la información (precios, sellos, detalles). */
              secondary: 'rgb(var(--af-secondary-rgb) / <alpha-value>)',
              'secondary-text': 'rgb(var(--af-secondary-text-rgb) / <alpha-value>)',
              'secondary-soft': 'rgb(var(--af-secondary-soft-rgb) / <alpha-value>)',
              'secondary-solid': 'rgb(var(--af-secondary-solid-rgb) / <alpha-value>)',
              border: 'rgb(var(--af-border-rgb) / <alpha-value>)',
              success: 'rgb(var(--af-success-rgb) / <alpha-value>)',
              danger: 'rgb(var(--af-danger-rgb) / <alpha-value>)',
              'danger-text': 'rgb(var(--af-danger-text-rgb) / <alpha-value>)',
            },
            /* --- «Warm Culinary Hearth» -----------------------------------
               Paleta de la portada de Descubrir. Los pares claro/oscuro se
               usan con `dark:` en los componentes: el modo oscuro es un
               marrón tostado profundo, nunca un negro frío, para conservar
               la calidez del sistema. */
            hearth: {
              cream: '#FDFBF7',
              card: '#FFFFFF',
              oat: '#F5EEE6',
              'oat-deep': '#EDE0DB',
              espresso: '#2B2421',
              pebble: '#786E68',
              line: '#E7DAD3',
              terracotta: '#DD6B4D',
              'terracotta-deep': '#B34A2E',
              'terracotta-soft': '#FDEFE9',
              'terracotta-ink': '#8A311A',
              honey: '#F59E0B',
              'honey-soft': '#FEF6E7',
              'honey-ink': '#92400E',
              sage: '#5F8D64',
              'sage-soft': '#EDF4EE',
              'sage-ink': '#2F5D36',
              night: '#131110',
              'night-soft': '#1F1C1A',
              'night-card': '#1F1C1A',
              'night-oat': '#2E2420',
              'night-line': '#3D302B',
              'night-ink': '#F6EBE6',
              'night-pebble': '#B9A8A1',
              'night-terracotta': '#F08A6A',
              'night-terracotta-soft': '#3A241D',
              'night-terracotta-ink': '#F7B29C',
              'night-sage-soft': '#1E3022',
              'night-sage-ink': '#A7D3AC',
              'night-honey-soft': '#332615',
              'night-honey-ink': '#F7C873',
            }
          }
        }
      }
    };

module.exports = preset;
