
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Boton, Input } from '../ui';
import { MessageCircle, ShieldCheck, AlertTriangle, Mail, Check } from 'lucide-react';

interface FormularioLoginProps {
  cambiarModo: () => void;
}

export const FormularioLogin: React.FC<FormularioLoginProps> = ({ cambiarModo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recuerdame, setRecuerdame] = useState(false);
  
  // Estado para controlar foco del email
  const [emailFoco, setEmailFoco] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const formValid = isEmailValid && password.length > 0;

  useEffect(() => {
    const savedEmail = localStorage.getItem('smartfood_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRecuerdame(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    
    setLoading(true);
    setError(null);

    try {
      if (recuerdame) {
        localStorage.setItem('smartfood_email', email);
      } else {
        localStorage.removeItem('smartfood_email');
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      if (error.message?.includes('Invalid login credentials')) {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError(error.message || "Ocurrió un error inesperado.");
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
            className={email.length > 0 ? (isEmailValid ? "border-green-500/50" : (emailFoco ? "" : "border-red-500/50")) : ""}
            maxLength={100}
            />
            {/* Solo mostrar error si hay texto, no es válido Y el usuario ya salió del campo */}
            {email.length > 0 && !isEmailValid && !emailFoco && (
            <p className="text-[10px] text-red-400 mt-1 ml-1 absolute -bottom-4 animate-fadeIn">Formato inválido</p>
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

        <div className="flex items-center gap-2 animate-fadeIn px-1">
            <div className="relative flex items-center">
                <input 
                type="checkbox" 
                id="recuerdame" 
                checked={recuerdame}
                onChange={e => setRecuerdame(e.target.checked)}
                className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-white/20 bg-surface checked:border-primary checked:bg-primary transition-all"
                />
                <Check size={12} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" />
            </div>
            <label htmlFor="recuerdame" className="text-sm text-text-muted cursor-pointer select-none">Recuérdame</label>
        </div>

        {error && (
            <div className="animate-fadeIn p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-500 text-sm font-medium">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <span>{error}</span>
            </div>
        )}
        
        <div className="pt-2">
            <Boton 
                className={`w-full text-lg shadow-lg transition-all duration-300 py-4 ${!formValid ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-primary/20 hover:shadow-primary/40'}`} 
                type="submit" 
                cargando={loading}
                disabled={!formValid}
            >
                Ingresar al Panel
            </Boton>
        </div>

        <div className="mt-6 text-center">
            <p className="text-sm text-text-muted relative z-10">
            ¿No tienes una cuenta? 
            <button 
                type="button"
                onClick={cambiarModo} 
                className="text-primary font-bold hover:text-accent transition-colors ml-1"
            >
                Regístrate gratis
            </button>
            </p>
        </div>
    </form>
  );
};
