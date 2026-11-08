import type React from 'react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { mensajeDeError } from '@tuki/api-cliente';
import { usarAuth } from '@tuki/auth-react';
import { Boton, Cabecera, Entrada, MensajeError, Tarjeta } from '@tuki/ui-kit';

export const Entrar = () => {
  const { usuario, entrar, registrar } = usarAuth();
  const navegar = useNavigate();
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      if (modo === 'login') {
        await entrar({ email, password });
      } else {
        await registrar({ email, password, nombre, apellido, rol: 'cliente' });
      }
      navegar('/');
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Cabecera />
      <main className="tuki-main" style={{ maxWidth: 480 }}>
        <Tarjeta>
          <h1 className="tuki-titulo">
            {modo === 'login' ? 'Entra a Tuki' : 'Crea tu cuenta'}
          </h1>
          <p className="tuki-subtitulo">
            {modo === 'login'
              ? 'Tus pedidos y reseñas en un solo lugar.'
              : 'Guarda tus datos y pide más rápido.'}
          </p>

          <form onSubmit={(evento) => void enviar(evento)}>
            {modo === 'registro' ? (
              <>
                <Entrada
                  etiqueta="Nombre"
                  value={nombre}
                  onChange={(evento) => setNombre(evento.target.value)}
                  required
                />
                <Entrada
                  etiqueta="Apellido"
                  value={apellido}
                  onChange={(evento) => setApellido(evento.target.value)}
                  required
                />
              </>
            ) : null}

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
              minLength={8}
            />

            {error ? <MensajeError>{error}</MensajeError> : null}

            <div className="tuki-fila" style={{ marginTop: 16 }}>
              <Boton type="submit" disabled={enviando}>
                {enviando ? 'Enviando…' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
              </Boton>
              <Boton
                type="button"
                secundario
                onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}
              >
                {modo === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
              </Boton>
            </div>
          </form>
        </Tarjeta>
      </main>
    </>
  );
};
