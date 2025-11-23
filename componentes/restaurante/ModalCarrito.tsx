
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingCart, X, Trash2, Plus, Minus, User, MapPin, Phone, ChevronLeft, Edit2, Home, Briefcase, Save, Lock } from 'lucide-react';
import { Platillo } from '../../tipos/modelos';
import { LogoWhatsApp } from '../ui';
import { apiWhatsApp } from '../../servicios/misApis';

interface Props {
  carrito: { platillo: Platillo, cantidad: number }[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, delta: number) => void;
  restaurante: { nombre: string, whatsapp: string };
  estilos: any;
  isDark: boolean;
  vaciarCarrito: () => void;
  localAbierto?: boolean;
}

// Estructura de Dirección
interface DireccionEstructurada {
  id: string;
  alias: string;
  via: string;
  n1: string;
  n2: string;
  n3: string;
  barrio: string;
  complemento: string;
}

const VIAS = ['Calle', 'Carrera', 'Avenida', 'Diagonal', 'Transversal', 'Circular'];

export const ModalCarrito: React.FC<Props> = ({ 
  carrito, onClose, onRemove, onUpdate, restaurante, estilos, isDark, vaciarCarrito, localAbierto = true 
}) => {
  const subtotal = carrito.reduce((acc, item) => acc + (item.platillo.precio * item.cantidad), 0);
  const total = subtotal;

  // ESTADOS UI
  const [paso, setPaso] = useState<'resumen' | 'datos'>('resumen');
  const [modoDireccion, setModoDireccion] = useState<'lista' | 'editar'>('lista');
  
  // DATOS USUARIO
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  
  // DIRECCIONES
  const [direccionesGuardadas, setDireccionesGuardadas] = useState<DireccionEstructurada[]>([]);
  const [direccionSeleccionadaId, setDireccionSeleccionadaId] = useState<string | null>(null);
  
  // FORMULARIO DIRECCIÓN ACTUAL (Edición/Creación)
  const [formDir, setFormDir] = useState<DireccionEstructurada>({
    id: '', alias: 'Casa', via: 'Calle', n1: '', n2: '', n3: '', barrio: '', complemento: ''
  });

  // BLOQUEO DE SCROLL AL ABRIR
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // CARGA INICIAL
  useEffect(() => {
    const savedUser = localStorage.getItem('smartfood_user_basic');
    if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setNombre(parsed.nombre || '');
        setTelefono(parsed.telefono || '');
    }

    const savedAddrs = localStorage.getItem('smartfood_addresses');
    if (savedAddrs) {
        const parsed = JSON.parse(savedAddrs);
        setDireccionesGuardadas(parsed);
        if (parsed.length > 0) setDireccionSeleccionadaId(parsed[0].id);
        else setModoDireccion('editar');
    } else {
        setModoDireccion('editar');
    }
  }, []);

  // --- MANEJADORES INPUTS BÁSICOS ---
  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const val = e.target.value;
     if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(val)) setNombre(val);
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const val = e.target.value;
     if (/^\d*$/.test(val) && val.length <= 10) setTelefono(val);
  };

  // --- MANEJADORES DIRECCIÓN ---
  const iniciarNuevaDireccion = () => {
      setFormDir({ id: Date.now().toString(), alias: 'Casa', via: 'Calle', n1: '', n2: '', n3: '', barrio: '', complemento: '' });
      setModoDireccion('editar');
  };

  const editarDireccion = (dir: DireccionEstructurada) => {
      setFormDir(dir);
      setModoDireccion('editar');
  };

  const eliminarDireccion = (id: string) => {
      const nuevas = direccionesGuardadas.filter(d => d.id !== id);
      setDireccionesGuardadas(nuevas);
      localStorage.setItem('smartfood_addresses', JSON.stringify(nuevas));
      if (direccionSeleccionadaId === id) setDireccionSeleccionadaId(nuevas.length > 0 ? nuevas[0].id : null);
      if (nuevas.length === 0) iniciarNuevaDireccion();
  };

  const guardarDireccion = () => {
      if (!formDir.n1 || !formDir.n2 || !formDir.n3 || !formDir.barrio) return;

      let nuevas = [...direccionesGuardadas];
      const index = nuevas.findIndex(d => d.id === formDir.id);
      
      if (index >= 0) nuevas[index] = formDir;
      else nuevas.push(formDir);

      setDireccionesGuardadas(nuevas);
      localStorage.setItem('smartfood_addresses', JSON.stringify(nuevas));
      setDireccionSeleccionadaId(formDir.id);
      setModoDireccion('lista');
  };

  const handleFormDirChange = (field: keyof DireccionEstructurada, val: string) => {
      if ((field === 'n1' || field === 'n2' || field === 'n3')) {
          if (val.length > 5) return;
          if (!/^[a-zA-Z0-9]*$/.test(val)) return; 
      }
      if (field === 'barrio') {
          if (val.length > 40) return;
          if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]*$/.test(val)) return;
      }
      if (field === 'complemento') {
          if (val.length > 60) return;
          if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s#\-\.]*$/.test(val)) return;
      }
      setFormDir(prev => ({ ...prev, [field]: val }));
  };

  // --- VALIDACIÓN FINAL ---
  const isFormValid = () => {
      return nombre.trim().length >= 3 && telefono.length === 10 && direccionSeleccionadaId !== null;
  };

  const formatDireccion = (d: DireccionEstructurada) => {
      return `${d.via} ${d.n1} # ${d.n2} - ${d.n3}, ${d.barrio} ${d.complemento ? `(${d.complemento})` : ''}`;
  };

  const handleEnviarWhatsApp = () => {
    if (!isFormValid() || !localAbierto) return;

    // Guardar básicos
    localStorage.setItem('smartfood_user_basic', JSON.stringify({ nombre, telefono }));

    const dirSeleccionada = direccionesGuardadas.find(d => d.id === direccionSeleccionadaId);
    const direccionStr = dirSeleccionada ? formatDireccion(dirSeleccionada) : 'Sin dirección';

    // Preparar datos para la API
    const items = carrito.map(item => ({
        nombre: item.platillo.nombre,
        cantidad: item.cantidad,
        precio: item.platillo.precio
    }));

    // --- CONSUMO API PROPIA 3 (WhatsApp) ---
    const resultadoAPI = apiWhatsApp.generarLinkPedido(
        { nombre: restaurante.nombre, telefono: restaurante.whatsapp },
        { nombre, direccion: direccionStr, telefono },
        { items, total }
    );

    window.open(resultadoAPI.url, '_blank');
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[200] flex justify-end isolate">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onClose} />

      <div className="relative w-full max-w-md h-full shadow-2xl flex flex-col animate-slideIn overflow-hidden"
           style={{ backgroundColor: estilos.bg, color: estilos.text }}>
        
        {/* HEADER */}
        <div className="p-5 border-b flex justify-between items-center shrink-0" style={{ borderColor: estilos.border }}>
          <div className="flex items-center gap-3">
            {paso === 'datos' && (
              <button onClick={() => setPaso('resumen')} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <ChevronLeft size={24} />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold font-title" style={{ color: estilos.title }}>
                {paso === 'resumen' ? 'Tu Carrito' : 'Datos de Envío'}
              </h2>
              <p className="text-xs opacity-60 font-medium">{restaurante.nombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 relative scrollbar-hide">
          {paso === 'resumen' ? (
            carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
                <div className="p-6 rounded-full bg-black/5 dark:bg-white/5"><ShoppingCart size={48} /></div>
                <p className="font-medium">Tu carrito está vacío.</p>
                <button onClick={onClose} className="text-sm font-bold text-primary hover:underline">Volver al menú</button>
              </div>
            ) : (
              <div className="space-y-4">
                {carrito.map((item) => (
                  <div key={item.platillo.id} className="flex gap-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5 items-center relative group">
                    <img src={item.platillo.imagen_url || 'https://via.placeholder.com/100'} alt={item.platillo.nombre} className="w-20 h-20 rounded-xl object-cover shadow-sm"/>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm leading-tight mb-1 truncate" style={{ color: estilos.title }}>{item.platillo.nombre}</h4>
                      <div className="font-bold text-primary text-sm">${(item.platillo.precio * item.cantidad).toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-end justify-between h-full gap-2">
                      <button onClick={() => onRemove(item.platillo.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
                      <div className="flex items-center gap-2 bg-bg px-1 py-1 rounded-lg shadow-sm border border-white/5">
                        <button onClick={() => onUpdate(item.platillo.id, -1)} className="w-6 h-6 flex items-center justify-center hover:text-primary"><Minus size={14}/></button>
                        <span className="text-xs font-bold w-4 text-center">{item.cantidad}</span>
                        <button onClick={() => onUpdate(item.platillo.id, 1)} className="w-6 h-6 flex items-center justify-center hover:text-primary"><Plus size={14}/></button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-center mt-6">
                   <button onClick={vaciarCarrito} className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"><Trash2 size={12} /> Vaciar Carrito</button>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-6 animate-slideIn">
              
              {/* DATOS PERSONALES */}
              <div className="space-y-4">
                 <h3 className="text-sm font-bold opacity-70 uppercase tracking-wider">Tus Datos</h3>
                 <div className="space-y-3">
                    <div className="flex items-center p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus-within:border-primary/30">
                       <User size={18} className="mr-3 opacity-50" />
                       <input value={nombre} onChange={handleNombreChange} placeholder="Tu Nombre Completo" className="bg-transparent outline-none w-full text-sm font-medium" />
                    </div>
                    <div className="flex items-center p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus-within:border-primary/30">
                       <Phone size={18} className="mr-3 opacity-50" />
                       <input type="tel" value={telefono} onChange={handleTelefonoChange} placeholder="Número Celular (10 dígitos)" maxLength={10} className="bg-transparent outline-none w-full text-sm font-medium" />
                    </div>
                 </div>
              </div>

              {/* SECCIÓN DIRECCIONES */}
              <div className="space-y-4 pt-4 border-t border-dashed border-gray-500/20">
                 <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold opacity-70 uppercase tracking-wider">Dirección de Entrega</h3>
                    {modoDireccion === 'lista' && direccionesGuardadas.length > 0 && (
                       <button onClick={iniciarNuevaDireccion} className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"><Plus size={14}/> Nueva</button>
                    )}
                 </div>

                 {modoDireccion === 'lista' ? (
                    <div className="space-y-3">
                        {direccionesGuardadas.map(dir => (
                            <div 
                                key={dir.id} 
                                onClick={() => setDireccionSeleccionadaId(dir.id)}
                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 relative group
                                ${direccionSeleccionadaId === dir.id ? 'border-primary bg-primary/5' : 'border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'}`}
                            >
                                <div className={`p-2 rounded-full ${direccionSeleccionadaId === dir.id ? 'bg-primary text-white' : 'bg-gray-500/20 text-gray-500'}`}>
                                    {dir.alias === 'Casa' ? <Home size={16}/> : dir.alias === 'Trabajo' ? <Briefcase size={16}/> : <MapPin size={16}/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold uppercase opacity-70">{dir.alias}</p>
                                    <p className="text-sm font-medium truncate">{formatDireccion(dir)}</p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); editarDireccion(dir); }} className="p-1.5 hover:bg-gray-500/20 rounded-md text-blue-400"><Edit2 size={14}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); eliminarDireccion(dir.id); }} className="p-1.5 hover:bg-red-500/20 rounded-md text-red-400"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                        {direccionesGuardadas.length === 0 && (
                             <div className="text-center py-4 text-sm opacity-60">No tienes direcciones guardadas.</div>
                        )}
                    </div>
                 ) : (
                    <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl space-y-4 animate-fadeIn">
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {['Casa', 'Trabajo', 'Pareja', 'Otro'].map(alias => (
                                <button 
                                    key={alias} 
                                    onClick={() => setFormDir(prev => ({ ...prev, alias }))}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${formDir.alias === alias ? 'bg-primary text-white border-primary' : 'border-gray-500/30 opacity-60 hover:opacity-100'}`}
                                >
                                    {alias}
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex gap-2 items-center">
                             <select 
                                value={formDir.via} 
                                onChange={e => handleFormDirChange('via', e.target.value)}
                                className="bg-bg p-2 rounded-lg text-sm outline-none border border-transparent focus:border-primary/30"
                             >
                                {VIAS.map(v => <option key={v} value={v}>{v}</option>)}
                             </select>
                             <input 
                                placeholder="Num" 
                                value={formDir.n1}
                                onChange={e => handleFormDirChange('n1', e.target.value)}
                                className="flex-1 w-16 bg-bg p-2 rounded-lg text-center text-sm outline-none border border-transparent focus:border-primary/30"
                             />
                             <span className="font-bold text-lg opacity-50">#</span>
                             <input 
                                placeholder="Num" 
                                value={formDir.n2}
                                onChange={e => handleFormDirChange('n2', e.target.value)}
                                className="flex-1 w-16 bg-bg p-2 rounded-lg text-center text-sm outline-none border border-transparent focus:border-primary/30"
                             />
                             <span className="font-bold text-lg opacity-50">-</span>
                             <input 
                                placeholder="Num" 
                                value={formDir.n3}
                                onChange={e => handleFormDirChange('n3', e.target.value)}
                                className="flex-1 w-16 bg-bg p-2 rounded-lg text-center text-sm outline-none border border-transparent focus:border-primary/30"
                             />
                        </div>

                        <input 
                             placeholder="Barrio (Ej: El Poblado)" 
                             value={formDir.barrio}
                             onChange={e => handleFormDirChange('barrio', e.target.value)}
                             className="w-full bg-bg p-3 rounded-lg text-sm outline-none border border-transparent focus:border-primary/30"
                        />
                        <input 
                             placeholder="Detalles (Apto, Torre, color casa...)" 
                             value={formDir.complemento}
                             onChange={e => handleFormDirChange('complemento', e.target.value)}
                             className="w-full bg-bg p-3 rounded-lg text-sm outline-none border border-transparent focus:border-primary/30"
                        />

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setModoDireccion('lista')} className="flex-1 py-2 text-xs font-bold opacity-60 hover:opacity-100">Cancelar</button>
                            <button 
                                onClick={guardarDireccion}
                                disabled={!formDir.n1 || !formDir.n2 || !formDir.n3 || !formDir.barrio}
                                className="flex-1 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Save size={14}/> Guardar Dirección
                            </button>
                        </div>
                    </div>
                 )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        {carrito.length > 0 && (
          <div className="p-6 border-t bg-surface/50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]" style={{ borderColor: estilos.border }}>
            <div className="flex justify-between items-end mb-6">
               <span className="text-sm font-bold opacity-60">Total a Pagar</span>
               <span className="text-2xl font-black font-title" style={{ color: estilos.primary }}>${total.toLocaleString()}</span>
            </div>

            {paso === 'resumen' ? (
               <button 
                 onClick={() => setPaso('datos')}
                 disabled={!localAbierto}
                 className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2 
                    ${!localAbierto ? 'grayscale cursor-not-allowed opacity-70' : ''}`}
                 style={{ backgroundColor: !localAbierto ? '#9ca3af' : estilos.primary }}
               >
                 {localAbierto ? 'Continuar Compra' : 'Restaurante Cerrado'}
               </button>
            ) : (
               <button 
                 onClick={handleEnviarWhatsApp}
                 disabled={!isFormValid() || !localAbierto}
                 className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2 
                    ${(isFormValid() && localAbierto) ? 'hover:brightness-110' : 'opacity-50 cursor-not-allowed grayscale'}`}
                 style={{ backgroundColor: !localAbierto ? '#9ca3af' : '#25D366' }}
               >
                 {localAbierto ? (
                    <><LogoWhatsApp className="w-5 h-5" fill="currentColor"/> Enviar Pedido</>
                 ) : (
                    <><Lock size={18} /> Cerrado - No se envían pedidos</>
                 )}
               </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
