import { useEffect } from 'react';
import { useAuth } from '../contexto/ContextoAutenticacion';
import { useStoreCarrito } from '../modulos/pedidos';

/**
 * El carrito de un comensal sobrevive a la recarga y no se mezcla entre
 * cuentas. Se hidrata al entrar y se guarda en cada cambio; al cerrar sesión se
 * vacía para que en un equipo compartido nadie vea el pedido de otra persona.
 *
 * Solo se persiste para `cliente`: el carrito del menú público de un invitado
 * (o de un dueño mirando su propia carta) sigue viviendo en memoria, como
 * siempre.
 */
export const SincronizacionCarrito = () => {
  const { user, rol, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user || rol !== 'cliente') {
      useStoreCarrito.getState().reiniciar();
      return;
    }

    useStoreCarrito.getState().hidratar(user.id);
  }, [loading, user?.id, rol]);

  useEffect(() => {
    if (loading || !user || rol !== 'cliente') return;

    return useStoreCarrito.subscribe(() => {
      useStoreCarrito.getState().persistir(user.id);
    });
  }, [loading, user?.id, rol]);

  return null;
};
