
import React from 'react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Smartphone, CheckCircle2 } from 'lucide-react';
import { DemoInteractiva } from './DemoInteractiva';

interface Props {
  titular: { principal: string, destacado: string };
  isMobile: boolean;
  scrollToSection: (e: any, id: string) => void;
}

export const SeccionHero: React.FC<Props> = ({ titular, isMobile, scrollToSection }) => {
  const navigate = useNavigate();

  return (
    <header id="inicio" className="pt-32 pb-20 px-4 md:px-6 text-center max-w-6xl mx-auto relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-primary/20 rounded-full blur-[100px] md:blur-[128px] -z-10"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-secondary/10 rounded-full blur-[100px] md:blur-[128px] -z-10"></div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neumorphic text-xs md:text-sm text-primary font-semibold mb-8 border border-primary/20 shadow-lg shadow-primary/5">
          <Sparkles size={14} /> Potenciado por Inteligencia Artificial
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-8xl font-bold mb-8 font-serif leading-[1.1] md:leading-none text-text-main tracking-tighter animate-fadeIn drop-shadow-sm">
          {titular.principal} <br className="hidden md:block"/>
          <span className="text-primary ml-0 md:ml-3 block md:inline mt-2 md:mt-0">
            {titular.destacado}
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-text-muted mb-12 max-w-3xl mx-auto leading-relaxed font-normal px-2">
          Diseña, gestiona y escala. La solución definitiva para restauradores que buscan elegancia visual y eficiencia operativa, sin complicaciones técnicas.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 mb-16">
          <button 
            onClick={() => navigate('/auth?mode=register')}
            className="w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-white dark:text-primary neumorphic-btn hover:bg-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer group border border-primary/20 hover:border-primary/40"
          >
            Crear Restaurante <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
          </button>
          
          <button 
             onClick={(e) => scrollToSection(e, 'ejemplos')} 
             className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-white dark:text-text-muted hover:text-white dark:hover:text-text-main neumorphic-btn hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            <Smartphone size={20} /> Ver Sitios Creados
          </button>
        </div>

        <div className={`w-full transition-all duration-500 mb-12 flex justify-center ${isMobile ? 'hidden md:flex' : 'flex'}`}>
            <div className="w-full max-w-md md:max-w-none px-4 py-3 rounded-2xl neumorphic-inset bg-surface/50 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
               {['Setup en 10 min', 'Sin comisiones', 'Soporte 24/7'].map((txt, i) => (
                 <div key={i} className="flex items-center gap-3 text-text-muted">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i===0?'bg-green-500/20 text-green-500':i===1?'bg-blue-500/20 text-blue-500':'bg-purple-500/20 text-purple-500'}`}>
                       <CheckCircle2 size={16} />
                    </div>
                    <span className="font-medium">{txt}</span>
                 </div>
               ))}
            </div>
        </div>
        <DemoInteractiva />
    </header>
  );
};