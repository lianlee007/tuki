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
  /**
   * Inicia sesión solo si la cuenta puede navegar este frontend. `rolEsperado`
   * evita que un superadmin o el rol contrario entren por la puerta equivocada.
   */
  iniciarSesion: (
    email: string,
    password: string,
    rolEsperado?: Rol,
  ) => Promise<Usuario | null>;
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
  iniciarSesion: async () => null,
  registrar: async () => null,
  cerrarSesion: async () => {},
});

export const useAuth = () => useContext(AuthContext);

/** Roles que pueden navegar la interfaz pública y el panel del restaurante. */
const ROLES_NAVEGABLES: Usuario['rol'][] = ['cliente', 'dueno'];

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

  /**
   * Comensal y restaurante son las dos únicas puertas de esta interfaz. Un
   * superadmin se administra desde su consola; si llega con una sesión guardada,
   * se descarta para que no quede atrapado en una vista que no le corresponde.
   */
  const rolValido: Rol | null =
    usuario?.rol === 'cliente' ? 'cliente' : usuario?.rol === 'dueno' ? 'restaurante' : null;
  const usuarioValido = rolValido ? usuario : null;

  useEffect(() => {
    setAvatar(usuario?.avatarUrl ?? null);
  }, [usuario?.id, usuario?.avatarUrl]);

  const valor = useMemo<AuthContextType>(() => {
    const user = aHeredado(usuarioValido);

    return {
      user,
      session: user ? { user } : null,
      loading: cargando,
      rol: rolValido,
      cargandoRol: false,
      avatarUrl: avatar,
      guardarAvatar: async (url) => {
        if (!usuarioValido) return 'Entra a tu cuenta para cambiar la foto.';
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
      iniciarSesion: async (email, password, rolEsperado) => {
        const esperado =
          rolEsperado === 'cliente' ? 'cliente' : rolEsperado === 'restaurante' ? 'dueno' : null;

        return entrar(
          { email, password },
          {
            validar: (cuenta) => {
              if (cuenta.rol === 'superadmin') {
                return 'Esta cuenta es de administración de la plataforma. Entra desde la consola de superadministrador.';
              }
              if (esperado && cuenta.rol !== esperado) {
                return esperado === 'cliente'
                  ? 'Esta cuenta es de restaurante. Entra desde el acceso de restaurantes.'
                  : 'Esta cuenta es de comensal. Entra desde el acceso de comensales.';
              }
              return null;
            },
          },
        );
      },
      registrar: async (entrada) => {
        return registrar(entrada);
      },
      cerrarSesion: salir,
    };
  }, [usuarioValido, rolValido, cargando, avatar, entrar, registrar, salir]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
};

export const ProveedorAutenticacion: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ProveedorAuth apis={apis} rolesPermitidos={ROLES_NAVEGABLES}>
    <Puente>{children}</Puente>
  </ProveedorAuth>
);
