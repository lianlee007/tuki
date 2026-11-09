/**
 * Sesión del TukiTuki heredado sobre el servicio de identidad.
 *
 * La interfaz original consumía un objeto de Supabase (`user.id`,
 * `user.user_metadata.rol`…). Aquí se conserva esa forma para no tocar los
 * componentes, pero los datos vienen de `identidad-service`.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ProveedorAuth, usarAuth } from '@tuki/auth-react';
import type { Usuario } from '@tuki/dominio';
import { apis } from '../lib/api-tuki';

export type Rol = 'cliente' | 'restaurante';

/** Forma mínima del usuario que consumen los componentes heredados. */
export interface UsuarioHeredado {
  id: string;
  email: string;
  created_at: string;
  user_metadata: {
    nombre: string;
    apellido: string;
    rol: Rol;
  };
}

interface AuthContextType {
  user: UsuarioHeredado | null;
  session: { user: UsuarioHeredado } | null;
  loading: boolean;
  /** `null` mientras la sesión no está resuelta o no hay cuenta. */
  rol: Rol | null;
  cargandoRol: boolean;
  avatarUrl: string | null;
  guardarAvatar: (url: string | null) => Promise<string | null>;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  registrar: (entrada: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    rol?: 'cliente' | 'dueno';
  }) => Promise<Usuario | null>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  rol: null,
  cargandoRol: false,
  avatarUrl: null,
  guardarAvatar: async () => null,
  iniciarSesion: async () => {},
  registrar: async () => null,
  cerrarSesion: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const aHeredado = (usuario: Usuario | null): UsuarioHeredado | null =>
  usuario
    ? {
        id: usuario.id,
        email: usuario.email,
        created_at: usuario.creadoEn,
        user_metadata: {
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          rol: usuario.rol === 'cliente' ? 'cliente' : 'restaurante',
        },
      }
    : null;

const Puente: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario, cargando, entrar, registrar, salir } = usarAuth();
  const [avatar, setAvatar] = useState<string | null>(usuario?.avatarUrl ?? null);

  useEffect(() => {
    setAvatar(usuario?.avatarUrl ?? null);
  }, [usuario?.id, usuario?.avatarUrl]);

  const valor = useMemo<AuthContextType>(() => {
    const user = aHeredado(usuario);

    return {
      user,
      session: user ? { user } : null,
      loading: cargando,
      rol: usuario ? (usuario.rol === 'cliente' ? 'cliente' : 'restaurante') : null,
      cargandoRol: false,
      avatarUrl: avatar,
      guardarAvatar: async (url) => {
        if (!usuario) return 'Entra a tu cuenta para cambiar la foto.';
        try {
          const { usuario: actualizado } = await apis.identidad.actualizarPerfil({
            avatarUrl: url,
          });
          setAvatar(actualizado.avatarUrl ?? null);
          return null;
        } catch {
          return 'No pudimos guardar tu foto. Inténtalo otra vez.';
        }
      },
      iniciarSesion: async (email, password) => {
        await entrar({ email, password });
      },
      registrar: async (entrada) => {
        return registrar(entrada);
      },
      cerrarSesion: salir,
    };
  }, [usuario, cargando, avatar, entrar, registrar, salir]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
};

export const ProveedorAutenticacion: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ProveedorAuth apis={apis}>
    <Puente>{children}</Puente>
  </ProveedorAuth>
);
