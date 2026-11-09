import type React from 'react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { mensajeDeError } from '@tuki/api-cliente';
import { usarAuth } from '@tuki/auth-react';
import { Boton, Cabecera, Entrada, MensajeError, Tarjeta } from '@tuki/ui-kit';

export const Entrar = () => {
  const { usuario, entrar } = usarAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario?.rol === 'superadmin') return <Navigate to="/admin" replace />;

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const sesion = await entrar({ email, password });
      if (sesion.rol !== 'superadmin') {
        setError('Esta cuenta no tiene permisos de administración.');
      }
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Cabecera titulo="TukiTuki Admin" />
      <main className="tuki-main" style={{ maxWidth: 460 }}>
        <Tarjeta>
          <h1 className="tuki-titulo">Administración de la plataforma</h1>
          <p className="tuki-subtitulo">
            Acceso exclusivo para el superadministrador.
          </p>
          <form onSubmit={(evento) => void enviar(evento)}>
            <Entrada
              etiqueta="Correo"
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              required
            />
            <Entrada
              etiqueta="Contraseña"
              type="password"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              required
            />
            {error ? <MensajeError>{error}</MensajeError> : null}
            <Boton type="submit" disabled={enviando}>
              {enviando ? 'Entrando…' : 'Entrar'}
            </Boton>
          </form>
        </Tarjeta>
      </main>
    </>
  );
};
