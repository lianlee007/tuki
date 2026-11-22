import React, { useEffect } from 'react';
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
interface PaginaEntrarProps {
  /** Destino de la flecha «Volver». En el panel apunta al sitio público. */
  volverA?: string;
}

export default function PaginaEntrar({ volverA = '/' }: PaginaEntrarProps) {
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

  /* Al cambiar entre acceso y alta cambia la altura del formulario; sin esto,
     quien pulsa el enlace desde abajo aterriza a mitad de la pantalla nueva. */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [isLogin]);

  return (
    <>
      <SEO
        titulo="Entra a pedir | TukiTuki"
        descripcion="Entra a tu cuenta de comensal para guardar tu carrito y pedir a los restaurantes de Popayán."
      />
      <LayoutAuth
        volverA={volverA}
        etiqueta="Cuenta de comensal"
        titulo={isLogin ? 'Entra a pedir' : 'Crea tu cuenta de comensal'}
        subtitulo={
          isLogin
            ? 'Tu carrito, tus pedidos y tus restaurantes de siempre, en un solo lugar.'
            : 'Solo necesitas un correo. Puedes guardar tu dirección de entrega ahora o más tarde.'
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

        <p className="mt-6 hidden border-t border-[#E7DAD3] pt-5 text-center text-[12px] text-af-ink-secondary sm:block dark:border-white/10">
          {isLogin ? '¿Tienes un restaurante? ' : '¿Tienes un restaurante y quieres vender? '}
          <Link
            to={isLogin ? '/auth' : '/auth?modo=registro'}
            className="font-bold text-[#8A311A] underline decoration-[#DD6B4D]/40 decoration-2 underline-offset-4 transition-colors hover:decoration-[#DD6B4D] dark:text-[#F7B29C]"
          >
            {isLogin ? 'Entra a tu panel' : 'Crea tu cuenta de restaurante'}
          </Link>
        </p>
      </LayoutAuth>
    </>
  );
}
