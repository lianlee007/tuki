
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { RefreshCw, Ghost, XCircle, Volume2, VolumeX, Crown } from 'lucide-react';
import { Restaurante } from '../../tipos';
import { Boton } from '../ui';
import { useSonidos } from './hooks/useSonidos';
import { Confeti } from './efectos/Confeti';

const COLORES_RULETA = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#F1948A', '#82E0AA', '#85C1E9'
];

const FRASES_ELIMINACION = [
  "Hoy no es tu día de suerte.", "¡Gracias por participar!", "A la próxima será.",
  "El destino ha hablado.", "Has sido eliminado.", "Lo sentimos, te vas a casa.",
  "¡Ups! La ruleta no perdona.", "Mala racha, buen apetito."
];

interface Props {
  restaurantes: Restaurante[];
  onGanador: (r: Restaurante) => void;
}

export const JuegoRuleta: React.FC<Props> = ({ restaurantes, onGanador }) => {
  const [candidatos, setCandidatos] = useState<Restaurante[]>(restaurantes);
  const [eliminados, setEliminados] = useState<Restaurante[]>([]);
  const [girando, setGirando] = useState(false);
  const [rotacion, setRotacion] = useState(0);
  const [eliminadoActual, setEliminadoActual] = useState<Restaurante | null>(null);
  const [mensajeDespedida, setMensajeDespedida] = useState("");
  const [showConfeti, setShowConfeti] = useState(false);
  const [velocidadRapida, setVelocidadRapida] = useState(false); // Control de velocidad

  const { play, enabled: sonidoEnabled, toggle: toggleSonido } = useSonidos();

  // Resetear estado si cambian los restaurantes iniciales
  useEffect(() => {
    setCandidatos(restaurantes);
    setEliminados([]);
    setRotacion(0);
    setGirando(false);
    setEliminadoActual(null);
  }, [restaurantes]);

  const girar = useCallback(() => {
    if (candidatos.length < 2) {
      if (candidatos.length === 1) onGanador(candidatos[0]);
      return;
    }
    if (girando) return;

    setGirando(true);
    play('spin');

    // Determinar perdedor
    const indicePerdedor = Math.floor(Math.random() * candidatos.length);
    const perdedor = candidatos[indicePerdedor];

    // Calcular rotación
    const sliceAngle = 360 / candidatos.length;
    // El triángulo indicador está arriba (0deg / 360deg)
    // Cada item está posicionado en: (index * sliceAngle) + (sliceAngle / 2)
    const itemCenterAngle = (indicePerdedor * sliceAngle) + (sliceAngle / 2);

    // Para que el item termine arriba (0deg), la rueda debe rotar:
    // targetRotation = 360 - itemCenterAngle (o -itemCenterAngle normalizado)
    const spins = 360 * 8; // Vueltas completas para dramatismo
    const targetRotationBase = 360 - itemCenterAngle;

    setRotacion(prev => {
      const currentMod = prev % 360;
      let distanceToTarget = targetRotationBase - currentMod;
      // Asegurar giro positivo
      while (distanceToTarget < 0) distanceToTarget += 360;

      // Añadir aleatoriedad pequeña para realismo (que no caiga siempre en el centro exacto)
      const randomOffset = (Math.random() * sliceAngle * 0.8) - (sliceAngle * 0.4);

      return prev + spins + distanceToTarget + randomOffset;
    });

    const duracionGiro = velocidadRapida ? 3000 : 6500; // 3s rápido, 6.5s normal

    setTimeout(() => {
      setGirando(false);
      play('eliminate');
      setMensajeDespedida(FRASES_ELIMINACION[Math.floor(Math.random() * FRASES_ELIMINACION.length)]);
      setEliminadoActual(perdedor);
    }, duracionGiro);
  }, [candidatos, girando, onGanador, play, velocidadRapida]);

  const cerrarModalEliminado = useCallback(() => {
    if (eliminadoActual) {
      const nuevosCandidatos = candidatos.filter(c => c.id !== eliminadoActual.id);
      setCandidatos(nuevosCandidatos);
      setEliminados(prev => [...prev, eliminadoActual]);
      setEliminadoActual(null);

      if (nuevosCandidatos.length === 1) {
        play('fanfare');
        setShowConfeti(true);
        setTimeout(() => onGanador(nuevosCandidatos[0]), 2000);
      }
    }
  }, [eliminadoActual, candidatos, onGanador, play]);

  const generarConicGradient = useMemo(() => {
    return `conic-gradient(${candidatos.map((_, i) => {
      const start = (i / candidatos.length) * 100;
      const end = ((i + 1) / candidatos.length) * 100;
      return `${COLORES_RULETA[i % COLORES_RULETA.length]} ${start}% ${end}%`;
    }).join(', ')})`;
  }, [candidatos.length]);

  const elementosRuleta = useMemo(() => {
    return candidatos.map((r, i) => {
      const sliceAngle = 360 / candidatos.length;
      const rotation = (sliceAngle * i) + (sliceAngle / 2);
      const nombreTruncado = r.nombre.length > 15 ? r.nombre.substring(0, 15) + '..' : r.nombre;

      return (
        <div
          key={r.id}
          className="absolute top-0 left-1/2 w-1 h-1/2 origin-bottom flex flex-col justify-start items-center pt-4 md:pt-8"
          style={{
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            willChange: 'transform',
            backfaceVisibility: 'hidden'
          }}
        >
          <span
            className="text-white font-bold uppercase drop-shadow-md whitespace-nowrap text-[10px] md:text-sm tracking-wide px-2 py-0.5 bg-black/20 rounded-full backdrop-blur-sm shadow-sm"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              maxHeight: '140px',
              willChange: 'auto'
            }}
          >
            {nombreTruncado}
          </span>
        </div>
      );
    });
  }, [candidatos]);

  const porcentajeProgreso = useMemo(() => {
    const total = candidatos.length + eliminados.length;
    return total > 0 ? (candidatos.length / total) * 100 : 0;
  }, [candidatos.length, eliminados.length]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center justify-center h-full animate-fadeIn w-full relative max-w-6xl mx-auto px-4">
      <Confeti active={showConfeti} />

      {/* Estilos locales para clip-path */}
      <style>{`.clip-path-triangle { clip-path: polygon(0% 0%, 100% 0%, 50% 100%); }`}</style>

      {/* Controles superiores */}
      <div className="absolute top-0 right-0 lg:top-4 lg:right-4 z-50 flex gap-2">
        <button
          onClick={() => { play('click'); setVelocidadRapida(!velocidadRapida); }}
          className={`p-3 rounded-full neumorphic text-xs font-bold transition-all ${velocidadRapida ? 'bg-primary text-white' : 'text-text-muted hover:text-primary'}`}
          title={velocidadRapida ? "Velocidad Rápida" : "Velocidad Normal"}
        >
          {velocidadRapida ? 'RÁPIDO' : 'NORMAL'}
        </button>
        <button
          onClick={toggleSonido}
          className="p-3 rounded-full neumorphic text-text-muted hover:text-primary transition-colors"
          title={sonidoEnabled ? "Silenciar" : "Activar sonido"}
        >
          {sonidoEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      <div className="relative order-1 lg:order-2 py-6 lg:py-10 flex flex-col items-center">
        {/* Marcador triangular */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-40 filter drop-shadow-xl"
          style={{ willChange: 'auto', transform: 'translateZ(0)' }}
        >
          <div className="w-12 h-14 bg-text-main clip-path-triangle flex items-start justify-center pt-1 shadow-xl">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>

        <div className="rounded-full p-4 md:p-6 neumorphic shadow-inner border-[8px] border-surface relative">
          {/* Sombra interna para profundidad */}
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.2)] pointer-events-none z-20"></div>

          <div
            className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[450px] md:h-[450px] rounded-full overflow-hidden relative shadow-2xl border-4 border-white/10"
            style={{
              transform: `rotate(${rotacion}deg)`,
              transition: girando ? `transform ${velocidadRapida ? '3s' : '6.5s'} cubic-bezier(0.2, 0.8, 0.2, 1)` : 'none',
              background: generarConicGradient,
              willChange: girando ? 'transform' : 'auto',
              backfaceVisibility: 'hidden',
              perspective: '1000px',
              transformStyle: 'preserve-3d'
            }}
          >
            {elementosRuleta}
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <button
            onClick={() => { play('click'); girar(); }}
            disabled={girando || candidatos.length < 2}
            className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center border-4 border-surface shadow-xl transition-all group relative overflow-hidden
               ${girando ? 'neumorphic-inset opacity-90 cursor-not-allowed' : 'neumorphic hover:scale-105 active:scale-95'}
             `}
          >
            <span className={`font-black text-sm md:text-lg transition-colors z-10 ${girando ? 'text-primary' : 'text-text-main group-hover:text-primary'}`}>
              {girando ? <RefreshCw className="animate-spin" /> : 'GIRAR'}
            </span>
            {/* Efecto de brillo al hover */}
            {!girando && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
          </button>
        </div>
      </div>

      {/* Panel Lateral */}
      <div className="w-full max-w-sm space-y-6 order-2 lg:order-1">
        <div className="text-center lg:text-left mb-2 lg:mb-6">
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-text-main">La Rueda Decide</h2>
          <p className="text-text-muted text-sm md:text-base">Modo Eliminatoria</p>
        </div>

        <div className="neumorphic p-5 md:p-6 rounded-2xl border border-white/5">
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-text-main text-sm md:text-base">En Juego</h3>
            <span className="text-xl md:text-2xl font-bold text-primary">{candidatos.length}</span>
          </div>
          <div className="w-full bg-surface rounded-full h-2 overflow-hidden shadow-inner">
            <div
              className="bg-primary h-full transition-all duration-500 relative"
              style={{
                width: `${porcentajeProgreso}%`,
                willChange: 'width',
                transform: 'translateZ(0)'
              }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="neumorphic-inset p-5 md:p-6 rounded-2xl max-h-48 md:max-h-60 overflow-y-auto custom-scrollbar">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-red-400 text-xs md:text-sm uppercase tracking-wider sticky top-0 bg-bg/90 backdrop-blur-sm py-2 z-10">
            <Ghost size={16} /> Cementerio ({eliminados.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {eliminados.length === 0 && <p className="text-text-muted text-xs italic w-full text-center py-4">Nadie ha caído aún...</p>}
            {eliminados.map(e => (
              <span key={e.id} className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs line-through opacity-70 border border-red-500/10 animate-fadeIn">
                {e.nombre}
              </span>
            ))}
          </div>
        </div>
      </div>

      {eliminadoActual && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="neumorphic max-w-sm w-full p-8 rounded-3xl text-center relative border border-red-500/30 bg-bg shadow-2xl animate-zoomIn">
            <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 mb-4 animate-bounce shadow-lg">
              <XCircle size={40} />
            </div>
            <h3 className="text-2xl font-bold text-text-main mb-2">¡Eliminado!</h3>
            <h4 className="text-xl font-serif text-red-500 mb-4 font-bold">{eliminadoActual.nombre}</h4>
            <p className="text-text-muted mb-8 italic text-sm">"{mensajeDespedida}"</p>
            <Boton onClick={() => { play('click'); cerrarModalEliminado(); }} className="w-full justify-center !bg-red-500 !text-white shadow-lg hover:scale-105 active:scale-95">Continuar Juego</Boton>
          </div>
        </div>
      )}
    </div>
  );
};
