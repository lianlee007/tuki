
import React, { useState } from 'react';
// @ts-ignore
import { Link, useSearchParams } from 'react-router-dom';
import { LayoutAuth } from '../componentes/autenticacion/LayoutAuth';
import { FormularioLogin } from '../componentes/autenticacion/FormularioLogin';
import { FormularioRegistro } from '../componentes/autenticacion/FormularioRegistro';

export default function PaginaAutenticacion() {
  const [params] = useSearchParams();
  const [isLogin, setIsLogin] = useState(params.get('mode') !== 'register');

  return (
    <LayoutAuth
      volverA="/para-restaurantes"
      titulo={isLogin ? 'Bienvenido de nuevo' : 'Comienza tu viaje digital'}
      subtitulo={isLogin
        ? 'Gestiona tu restaurante, actualiza tu menú y conecta con tus clientes desde un solo lugar.'
        : 'Crea una experiencia web inolvidable para tu restaurante en cuestión de minutos.'}
    >
      {isLogin ? (
        <FormularioLogin cambiarModo={() => setIsLogin(false)} textoBoton="Ingresar al Panel" />
      ) : (
        <FormularioRegistro
          cambiarModo={() => setIsLogin(true)}
          rol="restaurante"
          textoBoton="Crear cuenta de restaurante"
        />
      )}

      <p className="mt-8 text-center text-[13px] text-af-ink-secondary">
        ¿Solo vienes a comer?{' '}
        <Link
          to="/entrar"
          className="font-semibold text-af-accent-text transition-opacity hover:opacity-80"
        >
          Entra como comensal
        </Link>
      </p>
    </LayoutAuth>
  );
}
