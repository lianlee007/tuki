import React from 'react';
// @ts-ignore
import { Link, useSearchParams } from 'react-router-dom';
import { SEO } from '../componentes/ui';
import { LayoutAuth } from '../componentes/autenticacion/LayoutAuth';
import { FormularioLogin } from '../componentes/autenticacion/FormularioLogin';
import { FormularioRegistro } from '../componentes/autenticacion/FormularioRegistro';
import { SelectorTipoCuenta } from '../componentes/autenticacion/SelectorTipoCuenta';

/**
 * Acceso de comensales.
 *
 * Es una puerta distinta de `/auth` (la de restaurantes) para que cada público
 * lea su propio idioma y para que el registro sepa que la cuenta es de cliente
 * desde el primer momento: al confirmar el correo no aparece un "Mi
 * Restaurante" vacío en el panel.
 */
export default function PaginaEntrar() {
  const [params, setParams] = useSearchParams();
  // El aviso del carrito usa `?modo=registro`; `?mode=register` se mantiene por
  // compatibilidad con enlaces antiguos.
  const isLogin =
    params.get('modo') !== 'registro' && params.get('mode') !== 'register';

  const cambiarModo = (nuevo: 'login' | 'registro') => {
    const siguientes = new URLSearchParams(params);
    siguientes.set('modo', nuevo);
    siguientes.delete('mode');
    setParams(siguientes, { replace: true });
  };

  return (
    <>
      <SEO
        titulo="Entra a pedir | Tuki"
        descripcion="Entra a tu cuenta de comensal para guardar tu carrito y pedir a los restaurantes de Popayán."
      />
      <LayoutAuth
        volverA="/"
        etiqueta="Cuenta de comensal"
        titulo={isLogin ? 'Entra a pedir' : 'Crea tu cuenta de comensal'}
        subtitulo={
          isLogin
            ? 'Tu carrito, tus pedidos y tus restaurantes de siempre, en un solo lugar.'
            : 'Solo necesitas un correo. Al final te pediremos tu dirección de entrega; puedes guardarla ahora o hacerlo más tarde.'
        }
        puntos={
          isLogin
            ? undefined
            : [
                'Guarda tus direcciones de entrega',
                'Sigue el estado de tus pedidos',
                'Reseña los platos que ya probaste',
              ]
        }
      >
        <SelectorTipoCuenta actual="cliente" modo={isLogin ? 'login' : 'registro'} />

        {isLogin ? (
          <FormularioLogin
            cambiarModo={() => cambiarModo('registro')}
            rol="cliente"
            textoBoton="Entrar a pedir"
          />
        ) : (
          <FormularioRegistro
            cambiarModo={() => cambiarModo('login')}
            rol="cliente"
            textoBoton="Crear mi cuenta"
          />
        )}

        <p className="mt-8 text-center text-[13px] text-af-ink-secondary">
          {isLogin ? '¿Tienes un restaurante? ' : '¿Tienes un restaurante y quieres vender? '}
          <Link
            to={isLogin ? '/auth' : '/auth?modo=registro'}
            className="font-semibold text-af-accent-text transition-opacity hover:opacity-80"
          >
            {isLogin ? 'Entra a tu panel' : 'Crea tu cuenta de restaurante'}
          </Link>
        </p>
      </LayoutAuth>
    </>
  );
}
