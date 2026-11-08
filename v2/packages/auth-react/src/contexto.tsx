import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Apis } from '@tuki/api-cliente';
import type { EntradaLogin, EntradaRegistro, Usuario } from '@tuki/dominio';
import { guardarTokens, leerTokens, limpiarTokens } from './almacen.js';

interface ContextoAuth {
  usuario: Usuario | null;
  cargando: boolean;
  entrar: (entrada: EntradaLogin) => Promise<Usuario>;
  registrar: (entrada: EntradaRegistro) => Promise<Usuario>;
  salir: () => Promise<void>;
}

const Contexto = createContext<ContextoAuth | null>(null);

/** Proveedor de sesión compartido por los tres frontends. */
export const ProveedorAuth: React.FC<{
  apis: Apis;
  children: React.ReactNode;
}> = ({ apis, children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;

    const recuperar = async () => {
      const { accessToken, refreshToken } = leerTokens();
      if (!accessToken) {
        if (vigente) setCargando(false);
        return;
      }

      try {
        const perfil = await apis.identidad.perfil();
        if (vigente) setUsuario(perfil.usuario);
      } catch {
        try {
          if (refreshToken) {
            const sesion = await apis.identidad.refrescar(refreshToken);
            guardarTokens(sesion);
            if (vigente) setUsuario(sesion.usuario);
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
  }, [apis]);

  const entrar = useCallback(
    async (entrada: EntradaLogin) => {
      const sesion = await apis.identidad.login(entrada);
      guardarTokens(sesion);
      setUsuario(sesion.usuario);
      return sesion.usuario;
    },
    [apis],
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
