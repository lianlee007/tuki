/**
 * Descripción: Proveedor de contexto para manejar la sesión y el estado de autenticación.
 *
 * Tuki tiene dos públicos y la cuenta lo dice: `cliente` es el comensal que
 * arma un carrito y pide; `restaurante` es el dueño que administra su menú en
 * el panel. La portada se navega sin cuenta, pero las acciones del comensal
 * (carrito, pedidos) piden una. El rol se lee de `public.users`, no del
 * metadata de Auth, para que el dueño de un restaurante no pueda cambiarlo
 * desde el navegador.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type Rol = 'cliente' | 'restaurante';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** `null` mientras la sesión no está resuelta o no hay cuenta. */
  rol: Rol | null;
  cargandoRol: boolean;
  /** Foto de perfil del comensal, o `null` si todavía no subió ninguna. */
  avatarUrl: string | null;
  /**
   * Guarda la foto en `users.avatar_url` y la deja disponible en la sesión.
   * Devuelve el mensaje de error, o `null` si se guardó.
   */
  guardarAvatar: (url: string | null) => Promise<string | null>;
  cerrarSesion: () => Promise<void>;
}

// Crear contexto
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  rol: null,
  cargandoRol: false,
  avatarUrl: null,
  guardarAvatar: async () => null,
  cerrarSesion: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const ProveedorAutenticacion: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState<Rol | null>(null);
  const [cargandoRol, setCargandoRol] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    // Verificar sesión actual al montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Suscribirse a cambios de autenticación (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * El rol se pide una vez por cuenta. Si la fila de `users` aún no estuviera
   * (una carrera con el trigger de alta), se usa el metadata como red de
   * seguridad para no dejar a un restaurante fuera de su panel. La misma
   * consulta trae la foto de perfil, que la ficha necesita para las reseñas.
   */
  useEffect(() => {
    let vigente = true;

    if (!user) {
      setRol(null);
      setAvatarUrl(null);
      setCargandoRol(false);
      return;
    }

    setCargandoRol(true);
    supabase
      .from('users')
      .select('rol, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!vigente) return;
        const delMetadata = user.user_metadata?.rol === 'restaurante' ? 'restaurante' : 'cliente';
        setRol(((data?.rol as Rol | undefined) ?? delMetadata));
        setAvatarUrl((data?.avatar_url as string | null | undefined) ?? null);
        setCargandoRol(false);
      });

    return () => {
      vigente = false;
    };
  }, [user]);

  const guardarAvatar = async (url: string | null) => {
    if (!user) return 'Entra a tu cuenta para cambiar la foto.';

    const { error } = await supabase
      .from('users')
      .update({ avatar_url: url })
      .eq('id', user.id);

    if (error) {
      // La columna existe desde la migración de avatares. Si falta, el
      // comensal puede seguir reseñando; solo se avisa.
      return /avatar_url|column/i.test(error.message)
        ? 'Tu foto no se pudo guardar porque falta aplicar la migración de avatares.'
        : 'No pudimos guardar tu foto. Inténtalo otra vez.';
    }

    setAvatarUrl(url);
    return null;
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        rol,
        cargandoRol,
        avatarUrl,
        guardarAvatar,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
