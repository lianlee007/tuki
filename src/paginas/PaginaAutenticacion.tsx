import React from 'react';
// @ts-ignore
import { Link, useSearchParams } from 'react-router-dom';
import { LayoutAuth } from '../componentes/autenticacion/LayoutAuth';
import { FormularioLogin } from '../componentes/autenticacion/FormularioLogin';
import { FormularioRegistro } from '../componentes/autenticacion/FormularioRegistro';
import { SelectorTipoCuenta } from '../componentes/autenticacion/SelectorTipoCuenta';

/**
 * Acceso de restaurantes.
 *
 * El tipo de cuenta se elige aquí y no se adivina: el título, el botón y el
 * enlace de alta dicen siempre "restaurante". Antes la misma pantalla parecía
 * servir para comensales y dueños, y quien venía a pedir podía crear la cuenta
 * equivocada sin darse cuenta.
 */
export default function PaginaAutenticacion() {
  const [params, setParams] = useSearchParams();
  // `?mode=register` es el enlace histórico de la landing; `?modo=` es el
  // formato nuevo. Se aceptan los dos para no romper enlaces ya compartidos.
  const isLogin =
    params.get('modo') !== 'registro' && params.get('mode') !== 'register';

  const cambiarModo = (nuevo: 'login' | 'registro') => {
    const siguientes = new URLSearchParams(params);
    siguientes.set('modo', nuevo);
    siguientes.delete('mode');
    setParams(siguientes, { replace: true });
  };

  const puntos = isLogin
    ? undefined
    : [
        'Menú digital y QR listos el mismo día',
        'Pedidos por WhatsApp con el carrito del comensal',
        'Temas, colores y tipografías a tu gusto',
      ];

  return (
    <LayoutAuth
      volverA="/para-restaurantes"
      etiqueta="Cuenta de restaurante"
      titulo={isLogin ? 'Panel de tu restaurante' : 'Publica el menú de tu restaurante'}
      subtitulo={
        isLogin
          ? 'Entra con la cuenta de dueño para actualizar tu menú, tus temas y tus pedidos.'
          : 'Crea la cuenta de dueño del restaurante. En minutos tendrás tu menú digital, tu QR y los pedidos por WhatsApp.'
      }
      puntos={puntos}
    >
      <SelectorTipoCuenta actual="restaurante" modo={isLogin ? 'login' : 'registro'} />

      {isLogin ? (
        <FormularioLogin
          cambiarModo={() => cambiarModo('registro')}
          rol="restaurante"
          textoBoton="Entrar a mi panel"
        />
      ) : (
        <FormularioRegistro
          cambiarModo={() => cambiarModo('login')}
          rol="restaurante"
          textoBoton="Crear cuenta de restaurante"
        />
      )}

      <p className="mt-8 text-center text-[13px] text-af-ink-secondary">
        {isLogin ? '¿Solo vienes a comer? ' : '¿Vienes a comer, no a vender? '}
        <Link
          to={isLogin ? '/entrar' : '/entrar?modo=registro'}
          className="font-semibold text-af-accent-text transition-opacity hover:opacity-80"
        >
          {isLogin ? 'Entra como comensal' : 'Crea tu cuenta de comensal'}
        </Link>
      </p>
    </LayoutAuth>
  );
}
