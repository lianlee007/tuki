import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { Boton, Input } from '../ui';
import { ShieldCheck, AlertTriangle, Mail, Check, Eye, EyeOff } from 'lucide-react';
import { FOCO } from '../descubrir/estilos';

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
  const [verClave, setVerClave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recuerdame, setRecuerdame] = useState(false);
  const [emailTocado, setEmailTocado] = useState(false);
  const { iniciarSesion } = useAuth();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const formValid = isEmailValid && password.length > 0;
  const mostrarErrorEmail = emailTocado && email.length > 0 && !isEmailValid;

  useEffect(() => {
    // La clave se llamaba `smartfood_email` antes del renombrado a TukiTuki: se lee
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
    if (!formValid) {
      setEmailTocado(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (recuerdame) {
        localStorage.setItem('tuki_email', email);
      } else {
        localStorage.removeItem('tuki_email');
      }

      await iniciarSesion(email, password, rol);
    } catch (error: any) {
      const mensaje = String(error?.message || '');
      if (/credenciales|invalid login|incorrect/i.test(mensaje)) {
        setError('Correo o contraseña incorrectos. Revísalos e inténtalo de nuevo.');
      } else if (/rate limit|demasiad/i.test(mensaje)) {
        setError('Demasiados intentos seguidos. Espera un minuto e inténtalo otra vez.');
      } else {
        setError(mensaje || 'No pudimos iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full" autoComplete="on">
      <div className="space-y-3.5">
        <Input
          type="email"
          label="Correo electrónico"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTocado(true)}
          required
          icon={<Mail size={18} />}
          maxLength={100}
          autoComplete="email"
          inputMode="email"
          enterKeyHint="next"
          aria-invalid={mostrarErrorEmail}
          helper={mostrarErrorEmail ? 'Revisa el formato del correo.' : undefined}
          error={mostrarErrorEmail}
        />

        <div>
          <label htmlFor="clave-acceso" className="mb-1.5 ml-0.5 block text-xs font-semibold text-af-ink-secondary">
            Contraseña
          </label>

          <Input
            id="clave-acceso"
            type={verClave ? 'text' : 'password'}
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon={<ShieldCheck size={18} />}
            maxLength={64}
            autoComplete="current-password"
            enterKeyHint="go"
            accion={
              <button
                type="button"
                onClick={() => setVerClave((valor) => !valor)}
                aria-label={verClave ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
                aria-pressed={verClave}
                className={`af-pulsar flex h-10 w-10 items-center justify-center rounded-full text-af-ink-secondary transition-colors hover:text-af-ink ${FOCO}`}
              >
                {verClave ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            }
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex animate-fade-in-af items-start gap-2.5 rounded-xl border border-af-danger/30 bg-af-danger/10 p-3 text-[13px] font-medium text-af-danger"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <Boton
        className="mt-5 w-full !rounded-2xl !py-3.5 !text-[15px] font-bold"
        type="submit"
        cargando={loading}
        disabled={!formValid}
      >
        {textoBoton}
      </Boton>

      <label className="mt-4 flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-1 py-1 text-[12.5px] leading-snug text-af-ink-secondary">
        <span className="relative flex items-center">
          <input
            type="checkbox"
            checked={recuerdame}
            onChange={(e) => setRecuerdame(e.target.checked)}
            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-black/20 bg-af-ground transition-colors checked:border-af-accent checked:bg-af-accent dark:border-white/20 dark:bg-[#2C2C2E]"
          />
          <Check
            size={13}
            strokeWidth={3}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100"
            aria-hidden="true"
          />
        </span>
        Mantener mi correo en este dispositivo
      </label>

      <p className="mt-5 border-t border-black/[0.06] pt-4 text-center text-[12.5px] text-af-ink-secondary dark:border-white/10">
        {rol === 'restaurante'
          ? '¿Todavía no tienes cuenta de restaurante?'
          : '¿Aún no tienes cuenta de comensal?'}
        <button
          type="button"
          onClick={cambiarModo}
          className={`ml-1 rounded-md font-bold text-af-accent-text transition-opacity hover:opacity-70 ${FOCO}`}
        >
          {rol === 'restaurante' ? 'Crear cuenta de restaurante' : 'Crear cuenta de comensal'}
        </button>
      </p>
    </form>
  );
};
