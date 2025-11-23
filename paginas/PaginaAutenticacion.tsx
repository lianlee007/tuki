
import React, { useState, useEffect } from 'react';
// @ts-ignore
import { useLocation } from 'react-router-dom';
import { LayoutAuth } from '../componentes/autenticacion/LayoutAuth';
import { FormularioLogin } from '../componentes/autenticacion/FormularioLogin';
import { FormularioRegistro } from '../componentes/autenticacion/FormularioRegistro';

export default function PaginaAutenticacion() {
  const [isLogin, setIsLogin] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'register') {
      setIsLogin(false);
    }
  }, [location]);

  return (
    <LayoutAuth
      titulo={isLogin ? 'Bienvenido de nuevo' : 'Comienza tu viaje digital'}
      subtitulo={isLogin 
        ? 'Gestiona tu restaurante, actualiza tu menú y conecta con tus clientes desde un solo lugar.' 
        : 'Crea una experiencia web inolvidable para tu restaurante en cuestión de minutos.'}
    >
      {isLogin ? (
        <FormularioLogin key="login" cambiarModo={() => setIsLogin(false)} />
      ) : (
        <FormularioRegistro key="register" cambiarModo={() => setIsLogin(true)} />
      )}
    </LayoutAuth>
  );
}