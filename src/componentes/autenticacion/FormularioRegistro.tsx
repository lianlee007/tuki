import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
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
} from 'lucide-react';
import { FormularioDatosEnvio } from '../cuenta/FormularioDatosEnvio';
import type { DatosEnvio } from '../../lib/datosEnvio';

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  /** El comensal elige sus datos de entrega antes de crear la cuenta. */
  const [paso, setPaso] = useState<'cuenta' | 'envio'>('cuenta');

  useEffect(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setNombre('');
    setApellido('');
    setAceptaTerminos(false);
    setError(null);
    setEmailTouched(false);
    setPaso('cuenta');
  }, []);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasMinLength = password.length >= 8;

  const isEmailValid = emailRegex.test(email);
  const isStrongPassword = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
  const passwordsMatch = password === confirmPassword && password !== '';

  const formValid = isEmailValid && isStrongPassword && passwordsMatch && nombre.length > 0 && apellido.length > 0 && aceptaTerminos;

  const handleNameChange = (setter: (val: string) => void, value: string) => {
    if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value) && value.length <= 50) {
      setter(value);
    }
  };

  const crearCuenta = async (envio?: DatosEnvio, omitirEnvio = false) => {
    setLoading(true);
    setError(null);

    try {
      const metadata: Record<string, string> = { nombre, apellido, rol };
      if (envio) {
        metadata.telefono = envio.telefono;
        metadata.direccion = envio.direccion;
        metadata.barrio = envio.barrio;
        metadata.referencias = envio.referencias;
      }
      if (omitirEnvio) {
        metadata.omitir_datos_envio = 'true';
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      if (error) throw error;

      if (!data.session) {
        alert(
          'Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.'
        );
        cambiarModo();
        return;
      }

      if (rol === 'restaurante') {
        alert('Registro exitoso. Ya puedes administrar tu restaurante.');
        cambiarModo();
      }
      // Con sesión activa, `RutaAuth` lleva al comensal a la portada. No se
      // navega aquí para no competir con ese guardia de ruta.
    } catch (error: any) {
      if (
        error.message?.includes('already registered') ||
        error.message?.includes('already exists')
      ) {
        setError('Este correo electrónico ya está registrado. Intenta iniciar sesión.');
      } else {
        setError(error.message || 'Ocurrió un error inesperado.');
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
    <form onSubmit={handleSubmit} className="space-y-5 relative z-10 w-full" autoComplete="off">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-af">
        <Input
          placeholder="Nombre"
          value={nombre}
          onChange={e => handleNameChange(setNombre, e.target.value)}
          required
          className={nombre.length > 1 ? "border-af-success/30" : ""}
          maxLength={50}
          autoComplete="off"
          autoFocus={false}
        />
        <Input
          placeholder="Apellido"
          value={apellido}
          onChange={e => handleNameChange(setApellido, e.target.value)}
          required
          className={apellido.length > 1 ? "border-af-success/30" : ""}
          maxLength={50}
          autoComplete="off"
          autoFocus={false}
        />
      </div>

      <div className="relative">
        <Input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          required
          icon={<Mail size={18} />}
          className={email.length > 0 ? (isEmailValid ? "border-af-success/50" : (emailTouched ? "border-af-danger/50" : "")) : ""}
          maxLength={100}
          autoComplete="off"
          autoFocus={false}
        />
        {email.length > 0 && !isEmailValid && emailTouched && (
          <p className="text-[10px] text-af-danger mt-1 ml-1 absolute -bottom-4 animate-fade-in-af">Formato inválido</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          icon={<ShieldCheck size={18} />}
          className={password.length > 0 ? (isStrongPassword ? "border-af-success/50" : "border-amber-500/50") : ""}
          maxLength={64}
          autoComplete="new-password"
          autoFocus={false}
        />

        <Input
          type="password"
          placeholder="Confirmar"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          icon={<ShieldCheck size={18} />}
          className={confirmPassword.length > 0 ? (passwordsMatch ? "border-af-success/50" : "border-af-danger/50") : ""}
          maxLength={64}
          autoComplete="new-password"
          autoFocus={false}
        />
      </div>

      <div className="animate-fade-in-af space-y-2">
        <div className="bg-af-surface/30 dark:bg-black/30 p-3 rounded-xl border border-af/20 text-xs flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center justify-between">
          <span className="font-bold text-af-ink-secondary uppercase flex items-center gap-1 mb-1 sm:mb-0">
            <AlertCircle size={10} /> Seguridad:
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <div className={`flex items-center gap-1 ${password.length > 0 ? (hasMinLength ? 'text-af-success' : 'text-af-danger') : 'text-af-ink-secondary'}`}>
              <ValidationIcon valid={hasMinLength} active={password.length > 0} /> 8+ chars
            </div>
            <div className={`flex items-center gap-1 ${password.length > 0 ? (hasUpperCase ? 'text-af-success' : 'text-af-danger') : 'text-af-ink-secondary'}`}>
              <ValidationIcon valid={hasUpperCase} active={password.length > 0} /> Mayúscula
            </div>
            <div className={`flex items-center gap-1 ${password.length > 0 ? (hasLowerCase ? 'text-af-success' : 'text-af-danger') : 'text-af-ink-secondary'}`}>
              <ValidationIcon valid={hasLowerCase} active={password.length > 0} /> Minúscula
            </div>
            <div className={`flex items-center gap-1 ${password.length > 0 ? (hasNumber ? 'text-af-success' : 'text-af-danger') : 'text-af-ink-secondary'}`}>
              <ValidationIcon valid={hasNumber} active={password.length > 0} /> Número
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-1">
          <div className="relative flex items-center pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={aceptaTerminos}
              onChange={e => setAceptaTerminos(e.target.checked)}
              className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-400 dark:border-white/20 bg-af-surface checked:border-af-accent checked:bg-af-accent transition-all"
            />
            <Check size={12} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" />
          </div>
          <label htmlFor="terms" className="text-xs text-af-ink-secondary cursor-pointer select-none leading-snug">
            Acepto los <Link to="/terminos" target="_blank" className="text-af-accent hover:opacity-80 font-bold">términos</Link> y la <Link to="/privacidad" target="_blank" className="text-af-accent hover:opacity-80 font-bold">política de privacidad</Link>.
          </label>
        </div>
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
          ¿Ya tienes cuenta?
          <button
            type="button"
            onClick={cambiarModo}
            className="text-af-accent font-bold hover:opacity-80 transition-colors ml-1"
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </form>
  );
};
