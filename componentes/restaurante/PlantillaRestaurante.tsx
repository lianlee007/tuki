
/**
 * Descripción: Componente principal que orquesta la visualización del restaurante según el tema seleccionado.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Restaurante, Tema, Platillo } from '../../tipos';
import { ShoppingCart, X, Facebook, Instagram, Phone, Clock, MapPin, Sun, Moon, Mail, Sparkles, Lock } from 'lucide-react';
import { ImagenInteligente, LogoWhatsApp, ThemeToggle } from '../ui';
import { useTema } from '../../contexto/ContextoTema';
import { useStoreCarrito } from '../../store/storeCarrito';
import { ModalCarrito } from './ModalCarrito';
import { ModalDetallePlatillo } from './ModalDetallePlatillo';
import { apiSaludo, apiHorarios } from '../../servicios/misApis';

// Importación de las sub-plantillas (Modularidad)
import { EstiloModerno } from './plantillas/EstiloModerno';
import { EstiloCarta } from './plantillas/EstiloCarta';

// Helper para convertir HEX a RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
}

const DIAS_LABEL = [
  { key: 'lunes', label: 'L' }, { key: 'martes', label: 'M' }, { key: 'miercoles', label: 'X' },
  { key: 'jueves', label: 'J' }, { key: 'viernes', label: 'V' }, { key: 'sabado', label: 'S' }, { key: 'domingo', label: 'D' },
] as const;

export type EstilosComunes = {
  bg: string;
  text: string;
  title: string;
  primary: string;
  secondary: string;
  border: string;
  isDark: boolean;
  shadow: string;
  borderHighlight: string;
  borderShadow: string;
  backgroundImage?: string;
}

interface PlantillaProps {
  restaurante: Restaurante;
  tema: Tema;
  platillos: Platillo[];
  modoPreview?: boolean;
  onClosePreview?: () => void;
}

// Helper para formatear hora (quitar segundos)
const formatTime = (time?: string) => {
  if (!time) return '--:--';
  return time.slice(0, 5);
};

export const PlantillaRestaurante: React.FC<PlantillaProps> = ({ restaurante, tema, platillos, modoPreview, onClosePreview }) => {
  const { tema: temaGlobal, toggleTema } = useTema();
  const { carrito, modalAbierto, setModalAbierto, agregarItem, eliminarItem, actualizarCantidad, vaciarCarrito } = useStoreCarrito();
  const [categoriaActiva, setCategoriaActiva] = useState<string>("");
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Estado para el modal de detalle
  const [platilloSeleccionado, setPlatilloSeleccionado] = useState<Platillo | null>(null);

  // Estados de APIs Propias
  const [saludoDinamico, setSaludoDinamico] = useState<string>("");
  const [estadoLocal, setEstadoLocal] = useState<{ abierto: boolean, mensaje: string }>({ abierto: true, mensaje: "" });

  const isDark = temaGlobal === 'dark';

  // --- CONSUMO API PROPIA 4 (Saludo) ---
  useEffect(() => {
    const fetchSaludo = async () => {
      try {
        const data = await apiSaludo.obtenerMensajeBienvenida(restaurante.nombre);
        setSaludoDinamico(data.mensaje);
      } catch (error) {
        console.error("Error obteniendo saludo:", error);
      }
    };
    fetchSaludo();
  }, [restaurante.nombre]);

  // --- CONSUMO API PROPIA 1 (Horarios) ---
  useEffect(() => {
    const checkHorario = async () => {
      if (restaurante.horario_apertura && restaurante.horario_cierre) {
        const status = await apiHorarios.validarDisponibilidad(restaurante.horario_apertura, restaurante.horario_cierre);
        setEstadoLocal({ abierto: status.abierto, mensaje: status.mensaje });
      }
    };
    checkHorario();
    const interval = setInterval(checkHorario, 60000); // Chequear cada minuto
    return () => clearInterval(interval);
  }, [restaurante.horario_apertura, restaurante.horario_cierre]);

  // --- MOTOR DE COLOR DINÁMICO MEJORADO ---
  const isDefaultLight = ['#FFFFFF', '#F9FAFB', '#F0F9FF', '#F3F4F6', '#FAFBF6'].includes(tema.color_fondo);
  // En modo claro, forzamos el beige terroso si es un color default, sino usamos el del tema
  const bgBase = isDark ? '#1A1D21' : (isDefaultLight ? '#F5F1E8' : tema.color_fondo);

  const rgbPrimario = hexToRgb(tema.color_primario);
  const rgbFondo = hexToRgb(bgBase);

  // Lógica de sombras y bordes diferenciada por modo
  const shadowLightColor = isDark
    ? `rgba(${rgbPrimario}, 0.08)`
    : `transparent`; // Sin sombra en light mode

  const shadowDarkColor = isDark
    ? `rgba(0, 0, 0, 0.9)` // Sombra más profunda
    : `transparent`;

  // Bordes: Sólidos en light mode, sutiles pero definidos en dark mode
  const borderHighlight = isDark ? `rgba(255, 255, 255, 0.12)` : '#D4C4B0';
  const borderShadow = isDark ? 'rgba(0, 0, 0, 0.8)' : '#D4C4B0';

  // Borde general para elementos
  const mainBorder = isDark ? `rgba(${rgbPrimario}, 0.2)` : '#D4C4B0';

  const estilos: EstilosComunes = {
    bg: bgBase,
    text: isDark ? '#F3F4F6' : '#0F172A',
    title: isDark ? '#FFFFFF' : '#0F172A',
    primary: tema.color_primario,
    secondary: tema.color_secundario,
    border: mainBorder,
    isDark,
    // Sombra multicapa para efecto Deep 3D
    shadow: isDark
      ? `12px 12px 24px ${shadowDarkColor}, -12px -12px 24px ${shadowLightColor}, inset 1px 1px 0px ${borderHighlight}, inset -1px -1px 0px ${borderShadow}`
      : 'none',
    borderHighlight,
    borderShadow,
    // Textura de papel para modo claro
    backgroundImage: isDark ? 'none' : `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E")`
  };

  const menuPorCategoria = platillos.reduce((acc, p) => {
    const cat = p.categoria || 'Especialidades';
    if (!acc[cat]) acc[cat] = []; acc[cat].push(p); return acc;
  }, {} as Record<string, Platillo[]>);
  const categorias = Object.keys(menuPorCategoria);

  const scrollToCategory = (cat: string) => {
    setCategoriaActiva(cat);
    categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Handler para abrir el modal de detalles
  const handleVerPlatillo = (p: Platillo) => {
    setPlatilloSeleccionado(p);
  };

  // Handler para añadir desde el modal
  const handleAddToCartFromModal = (p: Platillo, cantidad: number) => {
    if (!estadoLocal.abierto) return;
    for (let i = 0; i < cantidad; i++) {
      agregarItem(p);
    }
  };

  // Handler para agregar directamente al carrito sin abrir detalles
  const handleAgregarAlCarrito = (p: Platillo, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevenir que se abra el modal de detalles
    }
    if (!estadoLocal.abierto) return;
    agregarItem(p);
  };

  return (
    <div style={{
      backgroundColor: estilos.bg,
      color: estilos.text,
      minHeight: '100vh',
      fontFamily: tema.fuente_cuerpo,
      backgroundImage: estilos.backgroundImage
    }} className="transition-colors duration-500 selection:bg-primary/30 relative overflow-hidden">

      {/* BLOBS DE FONDO (GLASSMORPHISM) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-10 md:opacity-20 mix-blend-screen" style={{ background: estilos.primary }}></div>
        <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-10 md:opacity-15 mix-blend-screen" style={{ background: estilos.secondary }}></div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${tema.fuente_titulos.replace(' ', '+')}:wght@400;700&family=${tema.fuente_cuerpo.replace(' ', '+')}:wght@300;400;600&display=swap');
        .font-title { font-family: '${tema.fuente_titulos}', serif; }
        
        /* Variables CSS para ThemeToggle compatible con tema del restaurante */
        :root {
          --bg-color: ${estilos.bg};
          --border-highlight: ${borderHighlight};
          --border-shadow: ${borderShadow};
          --shadow-dark: ${shadowDarkColor};
          --shadow-light: ${shadowLightColor};
          --text-muted: ${estilos.text}80;
          --primary: ${estilos.primary};
        }
        
        /* Estilos base reutilizables */
        .neumorphic-navbar { 
            background: ${isDark ? `rgba(${rgbFondo}, 0.85)` : `rgba(${rgbFondo}, 0.95)`}; 
            border-bottom: ${isDark ? `1px solid ${borderShadow}` : `2px solid ${mainBorder}`}; 
            backdrop-filter: blur(16px); 
        }
        
        .neumorphic-btn-public { 
          background: ${isDark ? `rgba(${rgbFondo}, 0.8)` : `rgba(${rgbFondo}, 1)`};
          box-shadow: ${isDark ? `5px 5px 10px ${shadowDarkColor}, -5px -5px 10px ${shadowLightColor}` : 'none'}; 
          border-radius: 0.75rem; 
          border: ${isDark ? `1px solid ${borderHighlight}` : `2px solid ${mainBorder}`};
          transition: all 0.2s ease;
          color: ${estilos.text}; /* Color explícito del tema */
          font-weight: 600;
        }
        
        .neumorphic-btn-public:hover {
          transform: translateY(-2px);
          ${isDark
          ? `box-shadow: 16px 16px 32px ${shadowDarkColor}, -16px -16px 32px ${shadowLightColor}, inset 1px 1px 0px ${borderHighlight}, inset -1px -1px 0px ${borderShadow};`
          : `border-color: #C4B4A0; box-shadow: 0 4px 8px rgba(139, 115, 85, 0.15);`
        }
        }

        .neumorphic-active { 
          background: ${estilos.bg};
          ${isDark
          ? `box-shadow: inset 6px 6px 12px ${shadowDarkColor}, inset -6px -6px 12px ${shadowLightColor}; border: 1px solid transparent;`
          : `box-shadow: inset 0 2px 4px rgba(139, 115, 85, 0.1); border: 2px solid #B4A490;`
        }
          color: ${estilos.primary}; 
          border-radius: 0.75rem; 
        }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      {/* NAVBAR COMÚN */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 neumorphic-navbar`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 md:h-24">
            <div className="flex items-center gap-2 sm:gap-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold font-title truncate max-w-[120px] sm:max-w-[150px] md:max-w-xs leading-none" style={{ color: estilos.title }}>{restaurante.nombre}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">

              {/* Theme Toggle Component - Compatible con colores del restaurante */}
              <div className="scale-90 sm:scale-100">
                <ThemeToggle />
              </div>

              <button onClick={() => setModalAbierto(true)} className="relative neumorphic-btn-public p-2 sm:p-2.5 md:p-3 rounded-full group">
                <ShoppingCart size={18} className="sm:w-5 sm:h-5 md:w-[22px] md:h-[22px]" style={{ color: estilos.text }} />
                {carrito.length > 0 && <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 text-[9px] sm:text-[10px] font-bold text-white px-1 sm:px-1.5 py-0.5 rounded-full shadow-sm" style={{ backgroundColor: estilos.primary }}>{carrito.reduce((acc, item) => acc + item.cantidad, 0)}</span>}
              </button>
              {modoPreview && onClosePreview && <button onClick={onClosePreview} className="flex items-center gap-1 sm:gap-2 neumorphic-btn-public px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-red-500 hover:text-red-600 font-bold"><X size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Cerrar</span></button>}
            </div>
          </div>
        </div>
        {/* Submenu Categorias */}
        <div className="w-full overflow-x-auto scrollbar-hide py-3 sm:py-4 border-t" style={{ borderColor: borderShadow }}>
          <div className="flex whitespace-nowrap px-3 sm:px-4 md:justify-center min-w-max gap-2 sm:gap-3 md:gap-4">
            {categorias.map(cat => (
              <button key={cat} onClick={() => scrollToCategory(cat)} className={`px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all ${categoriaActiva === cat ? 'neumorphic-active' : 'neumorphic-btn-public'}`}>{cat}</button>
            ))}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative min-h-[35vh] sm:min-h-[40vh] md:min-h-[50vh] flex items-center justify-center overflow-hidden mb-8 sm:mb-12 mx-2 sm:mx-4 mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl transition-all border border-white/10">
        <div className="absolute inset-0 z-0">
          <ImagenInteligente src={restaurante.imagen_banner_url || ''} className="w-full h-full object-cover" alt="Banner Restaurante" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </div>
        <div className="relative z-10 text-center w-full max-w-5xl mx-auto animate-fadeIn flex flex-col items-center py-4 sm:py-6 md:py-8">
          {restaurante.imagen_logo_url && (
            <div className="relative h-20 w-20 sm:h-28 sm:w-28 md:h-36 md:w-36 rounded-full overflow-hidden border-2 sm:border-4 shadow-2xl mb-4 sm:mb-6 backdrop-blur-md shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <ImagenInteligente src={restaurante.imagen_logo_url} alt="Logo" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Saludo Dinámico API */}
          {saludoDinamico && (
            <div className="mb-3 sm:mb-4 animate-fadeIn w-full">
              <span className="inline-flex items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-xs md:text-sm font-bold border border-white/10 shadow-sm gap-1.5 sm:gap-2 select-none hover:bg-white/30 transition-colors cursor-default">
                <Sparkles size={10} className="sm:w-3 sm:h-3 text-yellow-300 fill-yellow-300 animate-pulse shrink-0" />
                <span className="break-words">{saludoDinamico}</span>
              </span>
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 sm:mb-4 font-title drop-shadow-lg tracking-tight px-2 break-words w-full">{restaurante.nombre}</h1>
          <p className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto mb-4 sm:mb-6 md:mb-8 drop-shadow-md font-light italic px-2 break-words w-full">{restaurante.eslogan}</p>

          {/* Estado del Restaurante (API Horarios) */}
          <div className={`inline-flex items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold backdrop-blur-md gap-1.5 sm:gap-2 ${estadoLocal.abierto ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
            {estadoLocal.abierto ? <Clock size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" /> : <Lock size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" />}
            <span className="break-words text-center">{estadoLocal.mensaje}</span>
          </div>

        </div>
      </header>

      {/* CONTENIDO PRINCIPAL (SELECTOR DE ESTRATEGIA) */}
      <main className="relative z-10 min-h-[50vh]">
        {tema.estilo_plantilla === 'carta' ? (
          <EstiloCarta
            categorias={categorias}
            menuPorCategoria={menuPorCategoria}
            onVerPlatillo={handleVerPlatillo}
            onAgregarAlCarrito={handleAgregarAlCarrito}
            estilos={estilos}
            refs={categoryRefs}
            localAbierto={estadoLocal.abierto}
          />
        ) : (
          // Default: Moderno
          <EstiloModerno
            categorias={categorias}
            menuPorCategoria={menuPorCategoria}
            onVerPlatillo={handleVerPlatillo}
            onAgregarAlCarrito={handleAgregarAlCarrito}
            estilos={estilos}
            refs={categoryRefs}
            localAbierto={estadoLocal.abierto}
          />
        )}
      </main>

      {/* FOOTER REDISEÑADO */}
      <footer className="py-8 sm:py-12 md:py-16 mt-12 sm:mt-16 md:mt-20 border-t relative z-10" style={{ borderColor: estilos.border }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="p-4 sm:p-6 md:p-8 lg:p-12 relative overflow-hidden rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] border border-white/5 shadow-lg backdrop-blur-sm" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 lg:gap-16 relative z-10 items-start">

              {/* COLUMNA 1: IDENTIDAD */}
              <div className="space-y-4 sm:space-y-6 text-center sm:text-left">
                <div>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold font-title mb-2 sm:mb-3" style={{ color: estilos.title }}>
                    {restaurante.nombre}
                  </h3>
                  <div className="h-1 w-16 sm:w-20 bg-primary rounded-full mx-auto sm:mx-0 mb-3 sm:mb-4" style={{ backgroundColor: estilos.primary }}></div>
                </div>
                <p className="opacity-80 leading-relaxed text-xs sm:text-sm md:text-base font-light px-2 sm:px-0">
                  {restaurante.descripcion || "Descubre sabores únicos elaborados con pasión y dedicación."}
                </p>
                <div className="flex gap-3 sm:gap-4 justify-center sm:justify-start pt-2">
                  {restaurante.facebook && <a href={restaurante.facebook} className="neumorphic-btn-public p-2.5 sm:p-3 rounded-full hover:text-blue-500 transition-colors"><Facebook size={18} className="sm:w-5 sm:h-5" /></a>}
                  {restaurante.instagram && <a href={restaurante.instagram} className="neumorphic-btn-public p-2.5 sm:p-3 rounded-full hover:text-pink-500 transition-colors"><Instagram size={18} className="sm:w-5 sm:h-5" /></a>}
                  {restaurante.whatsapp && <a href={`https://wa.me/57${restaurante.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('¡Hola! Estoy interesado en realizar un pedido con su restaurante. ¿Me pueden ayudar?')}`} className="neumorphic-btn-public p-2.5 sm:p-3 rounded-full hover:text-green-500 transition-colors"><LogoWhatsApp className="w-4 h-4 sm:w-5 sm:h-5" /></a>}
                </div>
              </div>

              {/* COLUMNA 2: UBICACIÓN Y CONTACTO */}
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${estilos.primary}20`, color: estilos.primary }}>
                    <MapPin size={16} className="sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider mb-1 opacity-60">Ubicación</h4>
                    <p className="font-medium leading-snug text-sm sm:text-base md:text-lg break-words">{restaurante.direccion}</p>
                    <p className="opacity-70 mt-1 text-xs sm:text-sm">{restaurante.ciudad}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${estilos.secondary}20`, color: estilos.secondary }}>
                    <Phone size={16} className="sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider mb-1 opacity-60">Reservas</h4>
                    <p className="font-medium font-mono text-sm sm:text-base md:text-lg tracking-tight break-all">{restaurante.telefono}</p>
                    {restaurante.email && <p className="text-[10px] sm:text-xs opacity-60 mt-1 flex items-center gap-1 break-all"><Mail size={10} /> {restaurante.email}</p>}
                  </div>
                </div>
              </div>

              {/* COLUMNA 3: HORARIOS */}
              <div className="flex flex-col rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-center border border-white/5 shadow-inner bg-black/5 dark:bg-white/5 sm:col-span-2 md:col-span-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center text-white shadow-lg animate-pulse" style={{ backgroundColor: estilos.primary }}>
                  <Clock size={20} className="sm:w-6 sm:h-6" />
                </div>

                <h4 className="font-bold font-title text-lg sm:text-xl mb-2" style={{ color: estilos.title }}>Horario de Atención</h4>

                <div className="text-xl sm:text-2xl font-light mb-4 sm:mb-6 font-mono opacity-90">
                  {formatTime(restaurante.horario_apertura)} <span className="opacity-40 mx-1">-</span> {formatTime(restaurante.horario_cierre)}
                </div>

                <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
                  {DIAS_LABEL.filter(d => restaurante.dias_abierto?.[d.key]).map(d => (
                    <div
                      key={d.key}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all text-white shadow-md scale-110"
                      style={{ backgroundColor: estilos.primary }}
                      title="Abierto"
                    >
                      {d.label}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <div className="text-center mt-6 sm:mt-8 md:mt-12 opacity-40 text-[10px] sm:text-xs font-medium px-2">
            © {new Date().getFullYear()} {restaurante.nombre}. Creado con SmartFood.
          </div>
        </div>
      </footer>

      {/* MODAL DETALLES DEL PLATILLO */}
      {platilloSeleccionado && (
        <ModalDetallePlatillo
          platillo={platilloSeleccionado}
          onClose={() => setPlatilloSeleccionado(null)}
          onAddToCart={handleAddToCartFromModal}
          estilos={estilos}
          isDark={isDark}
          localAbierto={estadoLocal.abierto}
        />
      )}

      {/* MODAL CARRITO */}
      {modalAbierto && <ModalCarrito
        carrito={carrito}
        onClose={() => setModalAbierto(false)}
        onRemove={eliminarItem}
        onUpdate={actualizarCantidad}
        restaurante={{ nombre: restaurante.nombre, whatsapp: restaurante.whatsapp }}
        estilos={estilos}
        isDark={isDark}
        vaciarCarrito={vaciarCarrito}
        localAbierto={estadoLocal.abierto}
      />}
    </div>
  );
};
