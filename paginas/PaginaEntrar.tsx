import React, { useState } from 'react';
// @ts-ignore
import { Link, useSearchParams } from 'react-router-dom';
import { SEO } from '../componentes/ui';
import { LayoutAuth } from '../componentes/autenticacion/LayoutAuth';
import { FormularioLogin } from '../componentes/autenticacion/FormularioLogin';
import { FormularioRegistro } from '../componentes/autenticacion/FormularioRegistro';

/**
 * Acceso de comensales.
 *
 * Es una puerta distinta de `/auth` (la de restaurantes) para que cada público
 * lea su propio idioma y para que el registro sepa que la cuenta es de cliente
 * desde el primer momento: al confirmar el correo no aparece un «Mi
 * Restaurante» vacío en el panel.
 */
export default function PaginaEntrar() {
  const [params] = useSearchParams();
  const [isLogin, setIsLogin] = useState(params.get('modo') !== 'registro');

  return (
    <>
      <SEO
        titulo="Entra a pedir | Riki"
        descripcion="Entra a tu cuenta de comensal para guardar tu carrito y pedir a los restaurantes de Popayán."
      />
      <LayoutAuth
        volverA="/"
        titulo={isLogin ? 'Entra a pedir' : 'Crea tu cuenta de comensal'}
        subtitulo={
          isLogin
            ? 'Tu carrito, tus pedidos y tus restaurantes de siempre, en un solo lugar.'
            : 'Solo necesitas un correo. Explorar y pedir en Riki no tiene costo.'
        }
      >
        <div>
          {isLogin ? (
            <FormularioLogin cambiarModo={() => setIsLogin(false)} textoBoton="Entrar" />
          ) : (
            <FormularioRegistro
              cambiarModo={() => setIsLogin(true)}
              rol="cliente"
              textoBoton="Crear mi cuenta"
            />
          )}

          <p className="mt-8 text-center text-[13px] text-af-ink-secondary">
            ¿Tienes un restaurante?{' '}
            <Link
              to="/para-restaurantes"
              className="font-semibold text-af-accent-text transition-opacity hover:opacity-80"
            >
              Publica tu menú en Riki
            </Link>
          </p>
        </div>
      </LayoutAuth>
    </>
  );
}
