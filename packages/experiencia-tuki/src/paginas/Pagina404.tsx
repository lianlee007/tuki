import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { BotonCTA, Logo, TransicionPagina } from '../componentes/ui';

export default function Pagina404() {
  return (
    <TransicionPagina>
      <div className="min-h-screen bg-af-ground flex flex-col items-center justify-center p-6 text-center">
        <div className="w-32 h-32 rounded-[28px] flex items-center justify-center mb-8 border border-af/20 shadow-xl relative bg-af-accent-solid text-white">
          <Logo size={64} />
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-af-ink mb-4 font-system tracking-tight">
          ¡Se nos quemó el plato!
        </h1>

        <p className="text-lg text-af-ink-secondary mb-8 max-w-md leading-relaxed">
          Lo sentimos, la página que buscas no está en el menú o ha sido eliminada de la cocina.
        </p>

        <Link to="/">
          <BotonCTA iconoDerecho>
            <Home size={20} />
            Volver al Inicio
          </BotonCTA>
        </Link>

        <div className="mt-12 opacity-40 text-[11px] font-medium tracking-tighter uppercase">
          ERROR_CODE: DISH_NOT_FOUND
        </div>
      </div>
    </TransicionPagina>
  );
}
