
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingCart, X, Trash2, Plus, Minus, User, MapPin, Phone, ChevronLeft, Edit2, Home, Briefcase, Save, Lock } from 'lucide-react';
import { Platillo } from '../../tipos/modelos';
import { LogoWhatsApp } from '../ui';
import { apiWhatsApp } from '../../servicios/misApis';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { generarContenidoGroq } from '../../lib/servicioGroq';
import { LIMITES } from '../../constantes';

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
  const { user } = useAuth();
  const subtotal = carrito.reduce((acc, item) => acc + (item.platillo.precio * item.cantidad), 0);
  const total = subtotal;

  // Claves de localStorage asociadas al usuario
  const getStorageKey = (baseKey: string) => {
    return user ? `${baseKey}_${user.id}` : baseKey;
  };

  // ESTADOS UI
  const [paso, setPaso] = useState<'resumen' | 'datos'>('resumen');
  const [modoDireccion, setModoDireccion] = useState<'lista' | 'editar'>('lista');
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [corrigiendoBarrio, setCorrigiendoBarrio] = useState(false);

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
    const userKey = getStorageKey('smartfood_user_basic');
    const savedUser = localStorage.getItem(userKey);
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setNombre(parsed.nombre || '');
      setTelefono(parsed.telefono || '');
    }

    const addressesKey = getStorageKey('smartfood_addresses');
    const savedAddrs = localStorage.getItem(addressesKey);
    if (savedAddrs) {
      const parsed = JSON.parse(savedAddrs);
      setDireccionesGuardadas(parsed);
      if (parsed.length > 0) setDireccionSeleccionadaId(parsed[0].id);
      else setModoDireccion('editar');
    } else {
      setModoDireccion('editar');
    }
  }, [user]);

  // --- MANEJADORES INPUTS BÁSICOS ---
  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(val)) {
      setNombre(val);
      if (errorEnvio) setErrorEnvio(null); // Limpiar error al escribir
    }
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val) && val.length <= 10) {
      setTelefono(val);
      if (errorEnvio) setErrorEnvio(null); // Limpiar error al escribir
    }
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
    const addressesKey = getStorageKey('smartfood_addresses');
    localStorage.setItem(addressesKey, JSON.stringify(nuevas));
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
    const addressesKey = getStorageKey('smartfood_addresses');
    localStorage.setItem(addressesKey, JSON.stringify(nuevas));
    setDireccionSeleccionadaId(formDir.id);
    setModoDireccion('lista');
    if (errorEnvio) setErrorEnvio(null); // Limpiar error al guardar dirección
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

  // Corrección de ortografía para barrio usando Groq
  const corregirOrtografiaBarrio = async (valor: string) => {
    if (!valor || valor.trim().length < 2) return;
    if (corrigiendoBarrio) return;

    setCorrigiendoBarrio(true);
    try {
      const respuesta = await generarContenidoGroq(
        `Corrige la ortografía de este barrio o localidad colombiana: "${valor}". Responde SOLO con el nombre del barrio corregido, sin explicaciones ni texto adicional. Si el nombre ya está correcto, devuélvelo tal cual.`,
        "Eres un experto en geografía y ortografía de barrios y localidades colombianas. Corrige solo errores ortográficos, mantén el nombre original si está correcto."
      );
      const barrioCorregido = respuesta.trim().replace(/^["']|["']$/g, '').trim();
      if (barrioCorregido && barrioCorregido.length >= 2) {
        setFormDir(prev => ({ ...prev, barrio: barrioCorregido }));
      }
    } catch (error) {
      console.error('Error corrigiendo ortografía de barrio:', error);
    } finally {
      setCorrigiendoBarrio(false);
    }
  };

  const handleBarrioBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const valor = e.target.value.trim();
    if (valor && valor.length >= 2) {
      await corregirOrtografiaBarrio(valor);
    }
  };

  // --- VALIDACIÓN FINAL ---
  const isFormValid = () => {
    // Validar datos básicos
    if (nombre.trim().length < 3) return false;
    if (telefono.length !== 10) return false;

    // Validar dirección
    if (modoDireccion === 'editar') {
      // Si está editando, debe tener todos los campos de dirección completos
      if (!formDir.n1 || !formDir.n2 || !formDir.n3 || !formDir.barrio) return false;
    } else {
      // Si está en modo lista, debe tener una dirección seleccionada
      if (direccionSeleccionadaId === null) return false;
    }

    return true;
  };

  // Función para obtener mensajes de error específicos
  const getValidationErrors = () => {
    const errors: string[] = [];
    if (nombre.trim().length < 3) errors.push('El nombre debe tener al menos 3 caracteres');
    if (telefono.length !== 10) errors.push('El teléfono debe tener 10 dígitos');

    if (modoDireccion === 'editar') {
      if (!formDir.n1) errors.push('Falta el número principal de la dirección');
      if (!formDir.n2) errors.push('Falta el número secundario de la dirección');
      if (!formDir.n3) errors.push('Falta el número adicional de la dirección');
      if (!formDir.barrio) errors.push('Falta el barrio de la dirección');
    } else {
      if (direccionSeleccionadaId === null) errors.push('Debes seleccionar o crear una dirección de entrega');
    }

    return errors;
  };

  const formatDireccion = (d: DireccionEstructurada) => {
    return `${d.via} ${d.n1} # ${d.n2} - ${d.n3}, ${d.barrio} ${d.complemento ? `(${d.complemento})` : ''}`;
  };

  const handleEnviarWhatsApp = () => {
    if (!localAbierto) return;

    // Validar y mostrar errores si es necesario
    if (!isFormValid()) {
      const errores = getValidationErrors();
      setErrorEnvio(errores.join('. '));
      return;
    }

    setErrorEnvio(null);

    // Si está en modo edición, guardar la dirección primero
    if (modoDireccion === 'editar') {
      guardarDireccion();
    }

    // Guardar básicos
    const userKey = getStorageKey('smartfood_user_basic');
    localStorage.setItem(userKey, JSON.stringify({ nombre, telefono }));

    // Obtener dirección seleccionada o la que se acaba de guardar
    let dirSeleccionada = direccionesGuardadas.find(d => d.id === direccionSeleccionadaId);
    if (!dirSeleccionada && modoDireccion === 'editar') {
      // Si acabamos de guardar, buscar la última dirección guardada
      const addressesKey = getStorageKey('smartfood_addresses');
      const savedAddrs = localStorage.getItem(addressesKey);
      if (savedAddrs) {
        const parsed = JSON.parse(savedAddrs);
        dirSeleccionada = parsed[parsed.length - 1];
      }
    }
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

      <div className="relative w-full max-w-md h-full flex flex-col animate-slideIn overflow-hidden"
        style={{
          backgroundColor: estilos.bg,
          color: estilos.text,
          boxShadow: isDark ? '-10px 0 30px rgba(0,0,0,0.9)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>

        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b flex justify-between items-center shrink-0" style={{ borderColor: estilos.border }}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {paso === 'datos' && (
              <button onClick={() => setPaso('resumen')} className="p-1.5 sm:p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0">
                <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold font-title truncate" style={{ color: estilos.title }}>
                {paso === 'resumen' ? 'Tu Carrito' : 'Datos de Envío'}
              </h2>
              <p className="text-[10px] sm:text-xs opacity-60 font-medium truncate">{restaurante.nombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 sm:p-2 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors shrink-0">
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 relative scrollbar-hide">
          {paso === 'resumen' ? (
            carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
                <div className="p-6 rounded-full bg-black/5 dark:bg-white/5"><ShoppingCart size={48} /></div>
                <p className="font-medium">Tu carrito está vacío.</p>
                <button onClick={onClose} className="text-sm font-bold text-primary hover:underline">Volver al menú</button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {carrito.map((item) => (
                  <div key={item.platillo.id} className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl items-center relative group transition-all"
                    style={{
                      backgroundColor: isDark ? estilos.bg : 'rgba(0,0,0,0.05)',
                      boxShadow: isDark ? 'inset 2px 2px 5px rgba(0,0,0,0.5), inset -2px -2px 5px rgba(255,255,255,0.05)' : 'none',
                      border: isDark ? '1px solid rgba(255,255,255,0.05)' : 'none'
                    }}>
                    <img src={item.platillo.imagen_url || 'https://via.placeholder.com/100'} alt={item.platillo.nombre} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl object-cover shadow-sm shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm leading-tight mb-1 truncate" style={{ color: estilos.title }}>{item.platillo.nombre}</h4>
                      <div className="font-bold text-primary text-xs sm:text-sm">${(item.platillo.precio * item.cantidad).toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-end justify-between h-full gap-1.5 sm:gap-2 shrink-0">
                      <button onClick={() => onRemove(item.platillo.id)} className="p-1 sm:p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={14} className="sm:w-4 sm:h-4" /></button>
                      <div className="flex items-center gap-1.5 sm:gap-2 bg-bg px-1 py-0.5 sm:py-1 rounded-lg shadow-sm border border-white/5">
                        <button onClick={() => onUpdate(item.platillo.id, -1)} className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center hover:text-primary"><Minus size={12} className="sm:w-3.5 sm:h-3.5" /></button>
                        <span className="text-[10px] sm:text-xs font-bold w-3 sm:w-4 text-center">{item.cantidad}</span>
                        <button onClick={() => onUpdate(item.platillo.id, 1)} className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center hover:text-primary"><Plus size={12} className="sm:w-3.5 sm:h-3.5" /></button>
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
            <div className="space-y-5 sm:space-y-6 animate-slideIn">

              {/* DATOS PERSONALES */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-xs sm:text-sm font-bold opacity-70 uppercase tracking-wider">Tus Datos</h3>
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus-within:border-primary/30 transition-colors">
                    <User size={16} className="sm:w-[18px] sm:h-[18px] mr-2 sm:mr-3 opacity-50 shrink-0" />
                    <input value={nombre} onChange={handleNombreChange} placeholder="Tu Nombre Completo" maxLength={LIMITES.REST_NOMBRE} className="bg-transparent outline-none w-full text-xs sm:text-sm font-medium placeholder:opacity-50" />
                  </div>
                  <div className="flex items-center p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus-within:border-primary/30 transition-colors">
                    <Phone size={16} className="sm:w-[18px] sm:h-[18px] mr-2 sm:mr-3 opacity-50 shrink-0" />
                    <input type="tel" value={telefono} onChange={handleTelefonoChange} placeholder="Número Celular (10 dígitos)" maxLength={10} className="bg-transparent outline-none w-full text-xs sm:text-sm font-medium placeholder:opacity-50" />
                  </div>
                </div>
              </div>

              {/* SECCIÓN DIRECCIONES */}
              <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-dashed border-gray-500/20">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs sm:text-sm font-bold opacity-70 uppercase tracking-wider">Dirección de Entrega</h3>
                  {modoDireccion === 'lista' && direccionesGuardadas.length > 0 && (
                    <button onClick={iniciarNuevaDireccion} className="text-[10px] sm:text-xs text-primary font-bold flex items-center gap-1 hover:underline shrink-0"><Plus size={12} className="sm:w-3.5 sm:h-3.5" /> Nueva</button>
                  )}
                </div>

                {/* Mensaje de error solo cuando intenta enviar */}
                {errorEnvio && (
                  <div className="p-2.5 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/30 animate-fadeIn">
                    <p className="text-[10px] sm:text-xs font-bold text-red-400 mb-1">Faltan datos por completar:</p>
                    <p className="text-[10px] sm:text-xs text-red-300">{errorEnvio}</p>
                  </div>
                )}

                {modoDireccion === 'lista' ? (
                  <div className="space-y-2.5 sm:space-y-3">
                    {direccionesGuardadas.map(dir => (
                      <div
                        key={dir.id}
                        onClick={() => setDireccionSeleccionadaId(dir.id)}
                        className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2 sm:gap-3 relative group
                                ${direccionSeleccionadaId === dir.id ? 'border-primary bg-primary/5' : 'border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'}`}
                      >
                        <div className={`p-1.5 sm:p-2 rounded-full shrink-0 ${direccionSeleccionadaId === dir.id ? 'bg-primary text-white' : 'bg-gray-500/20 text-gray-500'}`}>
                          {dir.alias === 'Casa' ? <Home size={14} className="sm:w-4 sm:h-4" /> : dir.alias === 'Trabajo' ? <Briefcase size={14} className="sm:w-4 sm:h-4" /> : <MapPin size={14} className="sm:w-4 sm:h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs font-bold uppercase opacity-70">{dir.alias}</p>
                          <p className="text-xs sm:text-sm font-medium truncate">{formatDireccion(dir)}</p>
                        </div>
                        <div className="flex gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); editarDireccion(dir); }} className="p-1 sm:p-1.5 hover:bg-gray-500/20 rounded-md text-blue-400"><Edit2 size={12} className="sm:w-3.5 sm:h-3.5" /></button>
                          <button onClick={(e) => { e.stopPropagation(); eliminarDireccion(dir.id); }} className="p-1 sm:p-1.5 hover:bg-red-500/20 rounded-md text-red-400"><Trash2 size={12} className="sm:w-3.5 sm:h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                    {direccionesGuardadas.length === 0 && (
                      <div className="text-center py-3 sm:py-4 text-xs sm:text-sm opacity-60">No tienes direcciones guardadas.</div>
                    )}
                  </div>
                ) : (
                  <div className="bg-black/5 dark:bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl space-y-3 sm:space-y-4 animate-fadeIn">
                    <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {['Casa', 'Trabajo', 'Pareja', 'Otro'].map(alias => (
                        <button
                          key={alias}
                          onClick={() => setFormDir(prev => ({ ...prev, alias }))}
                          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold border transition-colors shrink-0 ${formDir.alias === alias ? 'bg-primary text-white border-primary' : 'border-gray-500/30 opacity-60 hover:opacity-100'}`}
                        >
                          {alias}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-1.5 sm:gap-2 items-center flex-wrap">
                      <select
                        value={formDir.via}
                        onChange={e => handleFormDirChange('via', e.target.value)}
                        className="bg-bg p-1.5 sm:p-2 rounded-lg text-xs sm:text-sm outline-none border border-transparent focus:border-primary/30 min-w-[100px]"
                      >
                        {VIAS.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <input
                        placeholder="Num"
                        value={formDir.n1}
                        onChange={e => handleFormDirChange('n1', e.target.value)}
                        className="flex-1 min-w-[50px] max-w-[60px] bg-bg p-1.5 sm:p-2 rounded-lg text-center text-xs sm:text-sm outline-none border border-transparent focus:border-primary/30"
                      />
                      <span className="font-bold text-base sm:text-lg opacity-50 shrink-0">#</span>
                      <input
                        placeholder="Num"
                        value={formDir.n2}
                        onChange={e => handleFormDirChange('n2', e.target.value)}
                        className="flex-1 min-w-[50px] max-w-[60px] bg-bg p-1.5 sm:p-2 rounded-lg text-center text-xs sm:text-sm outline-none border border-transparent focus:border-primary/30"
                      />
                      <span className="font-bold text-base sm:text-lg opacity-50 shrink-0">-</span>
                      <input
                        placeholder="Num"
                        value={formDir.n3}
                        onChange={e => handleFormDirChange('n3', e.target.value)}
                        className="flex-1 min-w-[50px] max-w-[60px] bg-bg p-1.5 sm:p-2 rounded-lg text-center text-xs sm:text-sm outline-none border border-transparent focus:border-primary/30"
                      />
                    </div>
                    <div className="relative">
                      <input
                        placeholder="Barrio (Ej: El Poblado)"
                        value={formDir.barrio}
                        onChange={e => handleFormDirChange('barrio', e.target.value)}
                        onBlur={handleBarrioBlur}
                        disabled={corrigiendoBarrio}
                        className="w-full bg-bg p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm outline-none border border-transparent focus:border-primary/30 disabled:opacity-50"
                      />
                      {corrigiendoBarrio && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <input
                      placeholder="Detalles (Apto, Torre, color casa...)"
                      value={formDir.complemento}
                      onChange={e => handleFormDirChange('complemento', e.target.value)}
                      maxLength={LIMITES.ADDR_TEXT}
                      className="w-full bg-bg p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm outline-none border border-transparent focus:border-primary/30"
                    />

                    <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
                      <button onClick={() => setModoDireccion('lista')} className="flex-1 py-2 text-[10px] sm:text-xs font-bold opacity-60 hover:opacity-100">Cancelar</button>
                      <button
                        onClick={guardarDireccion}
                        disabled={!formDir.n1 || !formDir.n2 || !formDir.n3 || !formDir.barrio}
                        className="flex-1 py-2 bg-primary text-white rounded-lg text-[10px] sm:text-xs font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2"
                      >
                        <Save size={12} className="sm:w-3.5 sm:h-3.5" /> Guardar Dirección
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
          <div className="p-4 sm:p-5 md:p-6 border-t bg-surface/50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]" style={{ borderColor: estilos.border }}>
            <div className="flex justify-between items-end mb-4 sm:mb-5 md:mb-6">
              <span className="text-xs sm:text-sm font-bold opacity-60">Total a Pagar</span>
              <span className="text-xl sm:text-2xl font-black font-title" style={{ color: estilos.primary }}>${total.toLocaleString()}</span>
            </div>

            {paso === 'resumen' ? (
              <button
                onClick={() => {
                  setPaso('datos');
                  setErrorEnvio(null); // Limpiar error al cambiar de paso
                }}
                disabled={!localAbierto}
                className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base text-white shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2 
                    ${!localAbierto ? 'grayscale cursor-not-allowed opacity-70' : ''}`}
                style={{ backgroundColor: !localAbierto ? '#9ca3af' : estilos.primary }}
              >
                {localAbierto ? 'Continuar Compra' : 'Restaurante Cerrado'}
              </button>
            ) : (
              <button
                onClick={handleEnviarWhatsApp}
                disabled={!isFormValid() || !localAbierto}
                className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base text-white shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2 
                    ${(isFormValid() && localAbierto) ? 'hover:brightness-110' : 'opacity-50 cursor-not-allowed grayscale'}`}
                style={{ backgroundColor: !localAbierto ? '#9ca3af' : '#25D366' }}
              >
                {localAbierto ? (
                  <><LogoWhatsApp className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" /> Enviar Pedido</>
                ) : (
                  <><Lock size={16} className="sm:w-[18px] sm:h-[18px]" /> Cerrado - No se envían pedidos</>
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
