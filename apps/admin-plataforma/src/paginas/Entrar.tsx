import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { mensajeDeError } from '@tuki/api-cliente';
import { usarAuth } from '@tuki/auth-react';
import { urlSitioPublico } from '../apis';
import {
  IconoActividad,
  IconoAlerta,
  IconoCandado,
  IconoCorreo,
  IconoEscudo,
  IconoFlechaIzquierda,
  IconoOjo,
  IconoOjoCerrado,
  IconoTienda,
} from '../componentes/iconos';
import { BotonTema, Marca, SimboloTuki } from '../componentes/ui';
import { useTema } from '../hooks/useTema';

export const Entrar = () => {
  const { usuario, entrar, salir } = usarAuth();
  const { tema, alternar } = useTema();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.matchMedia?.('(pointer: fine)').matches) {
      emailRef.current?.focus();
    }
  }, []);

  if (usuario?.rol === 'superadmin') return <Navigate to="/admin" replace />;

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const sesion = await entrar({ email, password });
      if (sesion.rol !== 'superadmin') {
        await salir();
        setError(
          'Esta cuenta no tiene permisos de administración. Usa una cuenta de superadministrador.',
        );
      }
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="admin-acceso">
      <div className="admin-acceso-tema">
        <BotonTema tema={tema} alternar={alternar} />
      </div>

      <section className="admin-acceso-lado" aria-labelledby="admin-acceso-lado-titulo">
        <div className="admin-acceso-lado-contenido">
          <Marca />
          <div>
            <p className="admin-acceso-eyebrow">Acceso reservado</p>
            <h2 id="admin-acceso-lado-titulo">
              La consola que mantiene a TukiTuki en orden.
            </h2>
            <p className="admin-acceso-lado-texto">
              Locales, cuentas, permisos y auditoría en un solo lugar. Cada acción
              queda registrada para que la plataforma sea fácil de cuidar.
            </p>
          </div>

          <ul className="admin-acceso-lista">
            <li>
              <span className="admin-acceso-lista-icono">
                <IconoTienda size={18} />
              </span>
              <span>
                <strong>Locales bajo control</strong>
                <small>Activa o suspende restaurantes al instante.</small>
              </span>
            </li>
            <li>
              <span className="admin-acceso-lista-icono">
                <IconoEscudo size={18} />
              </span>
              <span>
                <strong>Roles con criterio</strong>
                <small>Gestiona quién puede hacer qué.</small>
              </span>
            </li>
            <li>
              <span className="admin-acceso-lista-icono">
                <IconoActividad size={18} />
              </span>
              <span>
                <strong>Todo queda escrito</strong>
                <small>Auditoría clara de cada cambio sensible.</small>
              </span>
            </li>
          </ul>

          <p className="admin-acceso-sello">
            <SimboloTuki size={18} />
            TukiTuki · Administración de plataforma
          </p>
        </div>
      </section>

      <main className="admin-acceso-panel">
        <div className="admin-acceso-caja">
          <div className="admin-acceso-caja-marca">
            <span className="admin-acceso-caja-simbolo">
              <SimboloTuki size={24} />
            </span>
            <span>
              <strong>TukiTuki Admin</strong>
              <small>Consola de plataforma</small>
            </span>
          </div>

          <h1 className="admin-acceso-titulo">Entra a la consola</h1>
          <p className="admin-acceso-subtitulo">
            Usa tu cuenta de superadministrador. No hay registro público para este rol.
          </p>

          {usuario ? (
            <div className="admin-error admin-error-compacto" role="alert">
              <span className="admin-error-icono">
                <IconoAlerta size={18} />
              </span>
              <div>
                <strong>La sesión activa no tiene permisos</strong>
                <p>{usuario.email}</p>
              </div>
              <button type="button" className="admin-btn admin-btn-secundario" onClick={() => void salir()}>
                Cerrar sesión
              </button>
            </div>
          ) : null}

          <form onSubmit={(evento) => void enviar(evento)} noValidate>
            <div className="admin-campo">
              <label htmlFor="admin-email">Correo</label>
              <div className="admin-campo-control">
                <IconoCorreo size={17} className="admin-campo-icono" />
                <input
                  ref={emailRef}
                  id="admin-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  spellCheck={false}
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  placeholder="admin@tukituki.local"
                  required
                />
              </div>
            </div>

            <div className="admin-campo">
              <label htmlFor="admin-password">Contraseña</label>
              <div className="admin-campo-control">
                <IconoCandado size={17} className="admin-campo-icono" />
                <input
                  id="admin-password"
                  name="password"
                  type={verPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(evento) => setPassword(evento.target.value)}
                  placeholder="Tu contraseña"
                  required
                />
                <button
                  type="button"
                  className="admin-campo-ojo"
                  aria-label={verPassword ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
                  title={verPassword ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
                  onClick={() => setVerPassword((valor) => !valor)}
                >
                  {verPassword ? <IconoOjoCerrado size={17} /> : <IconoOjo size={17} />}
                </button>
              </div>
            </div>

            {error ? (
              <p className="admin-error admin-error-campo" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="admin-btn admin-btn-primario admin-btn-acceso" disabled={enviando}>
              {enviando ? (
                <>
                  <span className="admin-spinner admin-spinner-claro" aria-hidden="true" />
                  Comprobando acceso…
                </>
              ) : (
                'Entrar a la consola'
              )}
            </button>
          </form>

          <div className="admin-acceso-pie">
            <a href={urlSitioPublico} className="admin-enlace">
              <IconoFlechaIzquierda size={15} />
              Volver a TukiTuki
            </a>
            <span>Cuenta aprovisionada desde el servidor</span>
          </div>
        </div>
      </main>
    </div>
  );
};
