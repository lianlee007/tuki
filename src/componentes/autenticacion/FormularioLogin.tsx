import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Boton, Input } from '../ui';
import { ShieldCheck, AlertTriangle, Mail, Check } from 'lucide-react';

interface FormularioLoginProps {
  cambiarModo: () => void;
  textoBoton?: string;
  /** Decide el texto del enlace de alta: no es lo mismo crear cuenta de
   *  comensal que de restaurante, y el usuario debe saberlo antes de pulsar. */
  rol?: 'cliente' | 'restaurante';
}

export const FormularioLogin: React.FC<FormularioLoginProps> = ({
  cambiarModo,
  textoBoton = 'Ingresar al Panel',
  rol = 'restaurante',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recuerdame, setRecuerdame] = useState(false);
  const [emailFoco, setEmailFoco] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const formValid = isEmailValid && password.length > 0;

  useEffect(() => {
    // La clave se llamaba `smartfood_email` antes del renombrado a Tuki: se lee
    // la antigua para no perder el correo de quien ya lo tenía guardado.
    const savedEmail = localStorage.getItem('tuki_email') || localStorage.getItem('smartfood_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRecuerdame(true);
      localStorage.setItem('tuki_email', savedEmail);
      localStorage.removeItem('smartfood_email');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;

    setLoading(true);
    setError(null);

    try {
      if (recuerdame) {
        localStorage.setItem('tuki_email', email);
      } else {
        localStorage.removeItem('tuki_email');
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      const mensaje = String(error?.message || '');
      if (mensaje.includes('Invalid login credentials')) {
        setError('Correo o contraseña incorrectos. Revísalos e inténtalo de nuevo.');
      } else if (mensaje.includes('Email not confirmed')) {
        setError(
          'Tu correo aún no está confirmado. Abre el enlace que te enviamos y vuelve a entrar.'
        );
      } else if (mensaje.toLowerCase().includes('rate limit')) {
        setError('Demasiados intentos seguidos. Espera un minuto e inténtalo otra vez.');
      } else {
        setError(mensaje || 'No pudimos iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 relative z-10 w-full">
      <div className="relative">
        <Input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onFocus={() => setEmailFoco(true)}
          onBlur={() => setEmailFoco(false)}
          required
          icon={<Mail size={18} />}
          maxLength={100}
        />
        {email.length > 0 && !isEmailValid && !emailFoco && (
          <p className="text-[10px] text-af-danger mt-1 ml-1 absolute -bottom-4 animate-fade-in-af">Formato inválido</p>
        )}
      </div>

      <Input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        icon={<ShieldCheck size={18} />}
        maxLength={64}
      />

      <div className="flex items-center gap-2 animate-fade-in-af px-1">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id="recuerdame"
            checked={recuerdame}
            onChange={e => setRecuerdame(e.target.checked)}
            className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-af-border bg-af-surface checked:border-af-accent checked:bg-af-accent transition-all"
          />
          <Check size={12} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" />
        </div>
        <label htmlFor="recuerdame" className="text-sm text-af-ink-secondary cursor-pointer select-none">Recuérdame</label>
      </div>

      {error && (
        <div className="animate-fade-in-af p-3 rounded-xl bg-af-danger/10 border border-af-danger/30 flex items-center gap-3 text-af-danger text-sm font-medium">
          <AlertTriangle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="pt-2">
        <Boton
          className={`w-full text-lg transition-all duration-200 py-4 ${!formValid ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
          type="submit"
          cargando={loading}
          disabled={!formValid}
        >
          {textoBoton}
        </Boton>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-af-ink-secondary relative z-10">
          {rol === 'restaurante'
            ? '¿Todavía no tienes cuenta de restaurante?'
            : '¿Aún no tienes cuenta de comensal?'}
          <button
            type="button"
            onClick={cambiarModo}
            className="text-af-accent font-bold hover:opacity-80 transition-colors ml-1"
          >
            {rol === 'restaurante' ? 'Crear cuenta de restaurante' : 'Crear cuenta de comensal'}
          </button>
        </p>
      </div>
    </form>
  );
};
