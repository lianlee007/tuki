import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Apis } from '@tuki/api-cliente';
import type { EntradaLogin, EntradaRegistro, Rol, Usuario } from '@tuki/dominio';
import { guardarTokens, leerTokens, limpiarTokens } from './almacen.js';

interface OpcionesEntrada {
  /**
   * Valida la cuenta antes de guardar la sesión. Si devuelve un mensaje, el
   * acceso se rechaza y no queda ningún token en el navegador.
   */
  validar?: (usuario: Usuario) => string | null;
}

interface ContextoAuth {
  usuario: Usuario | null;
  cargando: boolean;
  entrar: (entrada: EntradaLogin, opciones?: OpcionesEntrada) => Promise<Usuario>;
  registrar: (entrada: EntradaRegistro) => Promise<Usuario>;
  salir: () => Promise<void>;
}

const Contexto = createContext<ContextoAuth | null>(null);

/** Proveedor de sesión compartido por los tres frontends. */
export const ProveedorAuth: React.FC<{
  apis: Apis;
  children: React.ReactNode;
  /**
   * Roles que pueden conservar una sesión en este frontend. Al recuperar una
   * sesión guardada, un rol fuera de la lista se descarta sin entrar en un
   * bucle de redirecciones.
   */
  rolesPermitidos?: Rol[];
}> = ({ apis, children, rolesPermitidos }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;

    const permitido = (cuenta: Usuario) =>
      !rolesPermitidos || rolesPermitidos.includes(cuenta.rol);

    const recuperar = async () => {
      const { accessToken, refreshToken } = leerTokens();
      if (!accessToken) {
        if (vigente) setCargando(false);
        return;
      }

      try {
        const perfil = await apis.identidad.perfil();
        if (!permitido(perfil.usuario)) {
          limpiarTokens();
        } else if (vigente) {
          setUsuario(perfil.usuario);
        }
      } catch {
        try {
          if (refreshToken) {
            const sesion = await apis.identidad.refrescar(refreshToken);
            if (!permitido(sesion.usuario)) {
              limpiarTokens();
            } else {
              guardarTokens(sesion);
              if (vigente) setUsuario(sesion.usuario);
            }
          } else {
            limpiarTokens();
          }
        } catch {
          limpiarTokens();
        }
      } finally {
        if (vigente) setCargando(false);
      }
    };

    void recuperar();
    return () => {
      vigente = false;
    };
  }, [apis, rolesPermitidos]);

  const entrar = useCallback(
    async (entrada: EntradaLogin, opciones?: OpcionesEntrada) => {
      const sesion = await apis.identidad.login(entrada);
      const rechazo =
        opciones?.validar?.(sesion.usuario) ??
        (rolesPermitidos && !rolesPermitidos.includes(sesion.usuario.rol)
          ? 'Esta cuenta no puede navegar en esta aplicación.'
          : null);

      if (rechazo) {
        // La sesión se creó en el servidor, pero este frontend no la admite:
        // se cierra para no dejar tokens de un rol que no puede navegar aquí.
        await apis.identidad.cerrarSesion(sesion.refreshToken).catch(() => undefined);
        throw new Error(rechazo);
      }

      guardarTokens(sesion);
      setUsuario(sesion.usuario);
      return sesion.usuario;
    },
    [apis, rolesPermitidos],
  );

  const registrar = useCallback(
    async (entrada: EntradaRegistro) => {
      const sesion = await apis.identidad.registrar(entrada);
      guardarTokens(sesion);
      setUsuario(sesion.usuario);
      return sesion.usuario;
    },
    [apis],
  );

  const salir = useCallback(async () => {
    const { refreshToken } = leerTokens();
    if (refreshToken) {
      await apis.identidad.cerrarSesion(refreshToken).catch(() => undefined);
    }
    limpiarTokens();
    setUsuario(null);
  }, [apis]);

  const valor = useMemo(
    () => ({ usuario, cargando, entrar, registrar, salir }),
    [usuario, cargando, entrar, registrar, salir],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
};

export const usarAuth = (): ContextoAuth => {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('usarAuth debe usarse dentro de ProveedorAuth.');
  return contexto;
};
