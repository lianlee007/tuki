import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { Boton, Input } from '../ui';
import {
  ShieldCheck,
  Check,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Mail,
  ArrowLeft,
  MapPin,
  Eye,
  EyeOff,
} from 'lucide-react';
import { FormularioDatosEnvio } from '../cuenta/FormularioDatosEnvio';
import type { DatosEnvio } from '../../modulos/cuenta';
import { apiCuenta } from '../../modulos/cuenta';

interface FormularioRegistroProps {
  cambiarModo: () => void;
  /** El papel viaja al trigger de alta: cliente no crea restaurante automático. */
  rol?: 'cliente' | 'restaurante';
  textoBoton?: string;
}

export const FormularioRegistro: React.FC<FormularioRegistroProps> = ({
  cambiarModo,
  rol = 'restaurante',
  textoBoton = 'Crear Cuenta',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [claveTocada, setClaveTocada] = useState(false);
  const [verClave, setVerClave] = useState(false);
  /** Confirmación en pantalla: una alerta del navegador se pierde y no dice qué sigue. */
  const [exito, setExito] = useState<{ mensaje: string; confirmarCorreo: boolean } | null>(null);
  /** El comensal elige sus datos de entrega antes de crear la cuenta. */
  const [paso, setPaso] = useState<'cuenta' | 'envio'>('cuenta');
  const { registrar } = useAuth();

  useEffect(() => {
    setEmail('');
    setPassword('');
    setNombre('');
    setApellido('');
    setAceptaTerminos(false);
    setError(null);
    setEmailTouched(false);
    setClaveTocada(false);
    setPaso('cuenta');
    setExito(null);
  }, []);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasMinLength = password.length >= 8;

  const isEmailValid = emailRegex.test(email);
  const isStrongPassword = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
  const mostrarErrorClave = claveTocada && password.length > 0 && !isStrongPassword;

  const formValid = isEmailValid && isStrongPassword && nombre.length > 0 && apellido.length > 0 && aceptaTerminos;

  /* Los nombres no son solo latinos: `\p{L}` acepta cualquier letra Unicode y
     evita rechazar a quien se llame, por ejemplo, 李 o Iñaki. */
  const handleNameChange = (setter: (val: string) => void, value: string) => {
    if (/^[\p{L}\p{M}\s'’-]*$/u.test(value) && value.length <= 50) {
      setter(value);
    }
  };

  const crearCuenta = async (envio?: DatosEnvio, omitirEnvio = false) => {
    setLoading(true);
    setError(null);

    try {
      const usuario = await registrar({
        email,
        password,
        nombre,
        apellido,
        rol: rol === 'restaurante' ? 'dueno' : 'cliente',
      });

      // Los datos de envío se guardan en el navegador, por cuenta.
      if (envio && usuario?.id) {
        await apiCuenta.guardarDatosEnvio(usuario.id, envio);
      }
      if (omitirEnvio) {
        // Se crea la cuenta sin dirección; podrá completarla en «Mi cuenta».
      }

      if (rol === 'restaurante') {
        setExito({
          mensaje: 'Tu cuenta de restaurante está lista. Te llevamos a tu panel…',
          confirmarCorreo: false,
        });
      }
    } catch (error: any) {
      const mensaje = String(error?.message || '');
      if (/ya existe|already registered|already exists/i.test(mensaje)) {
        setError(
          'Ese correo ya tiene una cuenta. Inicia sesión o usa otro correo electrónico.'
        );
      } else if (/contraseña|password/i.test(mensaje)) {
        setError(mensaje);
      } else if (/rate limit|demasiad/i.test(mensaje)) {
        setError('Demasiados intentos seguidos. Espera un minuto e inténtalo otra vez.');
      } else {
        setError(mensaje || 'No pudimos crear la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;

    // El comensal ve primero el paso de entrega; su botón de omitir crea la
    // cuenta sin dirección. El restaurante no necesita datos de envío.
    if (rol === 'cliente') {
      setError(null);
      setPaso('envio');
      return;
    }

    await crearCuenta();
  };

  const ValidationIcon = ({ valid, active }: { valid: boolean; active: boolean }) => {
    if (!active) return <div className="w-4 h-4 border border-af-border/50 rounded-full" />;
    return valid ? <Check size={16} className="text-af-success" /> : <XCircle size={16} className="text-af-danger" />;
  };

  if (exito) {
    return (
      <div className="relative z-10 w-full space-y-5 text-center">
        <div className="rounded-2xl border border-af-success/30 bg-af-success/10 p-6">
          <Check className="mx-auto mb-3 text-af-success" size={32} aria-hidden="true" />
          <p className="text-sm font-medium leading-relaxed text-af-ink">{exito.mensaje}</p>
        </div>

        {exito.confirmarCorreo && (
          <Boton type="button" className="w-full" onClick={cambiarModo}>
            Ya confirmé mi correo, iniciar sesión
          </Boton>
        )}

        <p className="text-xs leading-relaxed text-af-ink-secondary">
          {rol === 'restaurante'
            ? 'Con tu cuenta de restaurante administras el menú, el tema y los pedidos.'
            : 'Con tu cuenta de comensal guardas tus direcciones y sigues tus pedidos.'}
        </p>
      </div>
    );
  }

  if (paso === 'envio') {
    return (
      <div className="relative z-10 w-full space-y-5">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setPaso('cuenta');
          }}
          className="af-pulsar inline-flex items-center gap-1.5 text-xs font-semibold text-af-ink-secondary transition-colors hover:text-af-ink"
        >
          <ArrowLeft size={14} /> Volver a los datos de acceso
        </button>

        <div className="rounded-2xl border border-af-accent/20 bg-af-accent/5 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-af-accent-text">
            <MapPin size={14} /> Datos de envío
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-af-ink-secondary">
            Guárdalos ahora y tus próximos pedidos se llenan solos. Si prefieres,
            puedes crear la cuenta sin dirección y completarla después desde{' '}
            <strong className="font-semibold text-af-ink">Mi cuenta</strong>.
          </p>
        </div>

        <FormularioDatosEnvio
          guardando={loading}
          error={error}
          textoBoton="Crear mi cuenta y guardar"
          textoOmitir="Ahora no, crear mi cuenta sin dirección"
          nota="Solo lo ve el restaurante que recibe tu pedido. Podrás cambiarlo cuando quieras desde Mi cuenta."
          onGuardar={(datos) => crearCuenta(datos)}
          onOmitir={() => crearCuenta(undefined, true)}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 relative z-10 w-full" autoComplete="on">
      <div className="grid grid-cols-1 gap-3 animate-fade-in-af sm:grid-cols-2 md:gap-4">
        <Input
          id="registro-nombre"
          name="given-name"
          placeholder="Ej. Ana"
          label="Nombre"
          value={nombre}
          onChange={e => handleNameChange(setNombre, e.target.value)}
          required
          className={nombre.length > 1 ? "border-af-success/30" : ""}
          maxLength={50}
          autoComplete="given-name"
          enterKeyHint="next"
          autoFocus={false}
        />
        <Input
          id="registro-apellido"
          name="family-name"
          placeholder="Ej. Pérez"
          label="Apellido"
          value={apellido}
          onChange={e => handleNameChange(setApellido, e.target.value)}
          required
          className={apellido.length > 1 ? "border-af-success/30" : ""}
          maxLength={50}
          autoComplete="family-name"
          enterKeyHint="next"
          autoFocus={false}
        />
      </div>

      <div>
        <Input
          id="registro-email"
          name="email"
          type="email"
          placeholder="tu@correo.com"
          label="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          required
          icon={<Mail size={18} />}
          className={email.length > 0 ? (isEmailValid ? "border-af-success/50" : (emailTouched ? "border-af-danger/50" : "")) : ""}
          maxLength={100}
          autoComplete="username"
          inputMode="email"
          enterKeyHint="next"
          spellCheck={false}
          autoCapitalize="none"
          autoFocus={false}
          aria-invalid={emailTouched && email.length > 0 && !isEmailValid}
          error={email.length > 0 && !isEmailValid && emailTouched}
          helper={email.length > 0 && !isEmailValid && emailTouched ? 'Revisa el formato del correo.' : undefined}
        />
      </div>

      <div id="reglas-clave" className="animate-fade-in-af rounded-[14px] border border-[#E7DAD3] bg-white/70 p-3.5 dark:border-white/10 dark:bg-white/[0.04]">
        <span className="mb-2.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-af-ink-secondary">
          <AlertCircle size={12} aria-hidden="true" /> La contraseña necesita
        </span>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11.5px]">
          <div className={`flex items-center gap-1 ${password.length > 0 ? (hasMinLength ? 'text-af-success' : 'text-af-danger') : 'text-af-ink-secondary'}`}>
            <ValidationIcon valid={hasMinLength} active={password.length > 0} /> 8 caracteres
          </div>
          <div className={`flex items-center gap-1 ${password.length > 0 ? (hasUpperCase ? 'text-af-success' : 'text-af-danger') : 'text-af-ink-secondary'}`}>
            <ValidationIcon valid={hasUpperCase} active={password.length > 0} /> Una mayúscula
          </div>
          <div className={`flex items-center gap-1 ${password.length > 0 ? (hasLowerCase ? 'text-af-success' : 'text-af-danger') : 'text-af-ink-secondary'}`}>
            <ValidationIcon valid={hasLowerCase} active={password.length > 0} /> Una minúscula
          </div>
          <div className={`flex items-center gap-1 ${password.length > 0 ? (hasNumber ? 'text-af-success' : 'text-af-danger') : 'text-af-ink-secondary'}`}>
            <ValidationIcon valid={hasNumber} active={password.length > 0} /> Un número
          </div>
        </div>
      </div>

      <div>
        <Input
          id="registro-password"
          name="password"
          type={verClave ? 'text' : 'password'}
          placeholder="Crea una contraseña"
          label="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onBlur={() => setClaveTocada(true)}
          required
          minLength={8}
          /* Las mismas reglas que la lista de arriba, para que el navegador
             bloquee el envío sin depender solo de JavaScript. */
          pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
          icon={<ShieldCheck size={18} />}
          className={password.length > 0 ? (isStrongPassword ? "border-af-success/50" : "border-amber-500/50") : ""}
          maxLength={64}
          autoComplete="new-password"
          enterKeyHint="go"
          autoFocus={false}
          aria-describedby="reglas-clave"
          aria-invalid={mostrarErrorClave}
          error={mostrarErrorClave}
          helper={mostrarErrorClave ? 'La contraseña no cumple todos los requisitos de la lista.' : undefined}
          accion={
            <button
              type="button"
              onClick={() => setVerClave((valor) => !valor)}
              aria-label={verClave ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
              aria-pressed={verClave}
              className="af-pulsar flex h-12 w-12 items-center justify-center rounded-full text-af-ink-secondary transition-colors hover:text-af-ink"
            >
              {verClave ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          }
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="terms" className="flex min-h-[3rem] cursor-pointer items-start gap-3 px-1 py-1 text-[12.5px] leading-snug text-af-ink-secondary">
          <span className="relative mt-0.5 flex items-center">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              checked={aceptaTerminos}
              onChange={e => setAceptaTerminos(e.target.checked)}
              required
              className="peer h-5 w-5 cursor-pointer appearance-none rounded-[6px] border border-[#D9CBC3] bg-white transition-colors checked:border-[#B34A2E] checked:bg-[#B34A2E] dark:border-[#5A4A43] dark:bg-[#1F1C1A]"
            />
            <Check size={13} strokeWidth={3} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" aria-hidden="true" />
          </span>
          <span>
            Acepto los <Link to="/terminos" target="_blank" className="font-bold text-af-accent-text hover:opacity-80">términos</Link> y la <Link to="/privacidad" target="_blank" className="font-bold text-af-accent-text hover:opacity-80">política de privacidad</Link>.
          </span>
        </label>
      </div>

      {error && (
        <div role="alert" className="animate-fade-in-af flex items-start gap-2.5 rounded-xl border border-af-danger/30 bg-af-danger/10 p-3 text-[13px] font-medium text-af-danger">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <Boton
          className="w-full !rounded-[14px] !bg-[#B34A2E] !py-4 !text-[14.5px] !font-semibold tracking-[0.01em] !shadow-[0_18px_34px_-18px_rgba(179,74,46,0.75)] transition-colors hover:!bg-[#9C3E27] dark:!bg-[#C4562F] dark:hover:!bg-[#B34A2E]"
          type="submit"
          cargando={loading}
        >
          {textoBoton}
        </Boton>
      </div>

      <div className="text-center">
        <p className="text-[12px] text-af-ink-secondary relative z-10">
          {rol === 'restaurante' ? '¿Ya tienes cuenta de restaurante?' : '¿Ya tienes cuenta?'}
          <button
            type="button"
            onClick={cambiarModo}
            className="ml-1 font-bold text-[#8A311A] underline decoration-[#DD6B4D]/40 decoration-2 underline-offset-4 transition-colors hover:decoration-[#DD6B4D] dark:text-[#F7B29C]"
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </form>
  );
};
