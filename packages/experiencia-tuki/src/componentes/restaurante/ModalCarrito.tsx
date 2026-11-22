import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingCart, X, Trash2, Plus, Minus, User, MapPin, Phone, ChevronLeft, Edit2, Home, Briefcase, Save, Lock, ArrowRight,
} from 'lucide-react';
import { Platillo } from '../../tipos/modelos';
import { LogoWhatsApp } from '../ui';
import { apiWhatsApp } from '../../api/misApis';
import { apiPedidos } from '../../modulos/pedidos';
import { apiCuenta } from '../../modulos/cuenta';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { generarTextoIA } from '../../lib/servicioIA';
import { datosEnvioCompletos, formatearDireccionEnvio } from '../../modulos/cuenta';
import { variablesAf } from '../../lib/color';
import { LIMITES } from '../../constantes';
import type { EstilosComunes } from './PlantillaRestaurante';

interface Props {
  carrito: { platillo: Platillo; cantidad: number }[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, delta: number) => void;
  restaurante: { nombre: string; whatsapp: string };
  /** Necesario para guardar la copia del pedido en Supabase. */
  restauranteId?: string;
  estilos: EstilosComunes;
  isDark: boolean;
  vaciarCarrito: () => void;
  localAbierto?: boolean;
  /** Avisa al padre cuando el pedido ya salió hacia WhatsApp. */
  onPedidoEnviado?: (platilloId?: string) => void;
}

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

/** Claves del comensal en `localStorage`: contacto y direcciones guardadas. */
const PREFIJO_CLAVE = 'tuki';
/** Prefijo anterior al renombrado; solo se usa para arrastrar lo ya guardado. */
const PREFIJO_CLAVE_ANTERIOR = 'smartfood';

const claveComensal = (baseKey: string, userId?: string, prefijo = PREFIJO_CLAVE) =>
  userId ? `${prefijo}_${baseKey}_${userId}` : `${prefijo}_${baseKey}`;

export const ModalCarrito: React.FC<Props> = ({
  carrito, onClose, onRemove, onUpdate, restaurante, restauranteId, estilos, isDark, vaciarCarrito, localAbierto = true,
  onPedidoEnviado,
}) => {
  const { user } = useAuth();
  const e = estilos;
  const subtotal = carrito.reduce((acc, item) => acc + (item.platillo.precio * item.cantidad), 0);
  const total = subtotal;

  const usuarioId = user?.id;
  const nombreCuentaMeta = [user?.user_metadata?.nombre, user?.user_metadata?.apellido]
    .filter(Boolean)
    .join(' ')
    .trim();

  const getStorageKey = useCallback(
    (baseKey: string) => claveComensal(baseKey, usuarioId),
    [usuarioId]
  );

  const [paso, setPaso] = useState<'resumen' | 'datos'>('resumen');
  const [modoDireccion, setModoDireccion] = useState<'lista' | 'editar'>('lista');
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [corrigiendoBarrio, setCorrigiendoBarrio] = useState(false);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccionesGuardadas, setDireccionesGuardadas] = useState<DireccionEstructurada[]>([]);
  const [direccionSeleccionadaId, setDireccionSeleccionadaId] = useState<string | null>(null);
  /** Dirección completa guardada en la cuenta, si ya la completó. */
  const [direccionCuenta, setDireccionCuenta] = useState<string | null>(null);
  const [usarDireccionCuenta, setUsarDireccionCuenta] = useState(false);
  const [formDir, setFormDir] = useState<DireccionEstructurada>({
    id: '', alias: 'Casa', via: 'Calle', n1: '', n2: '', n3: '', barrio: '', complemento: '',
  });

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = anterior; };
  }, []);

  useEffect(() => {
    const alPulsar = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onClose(); };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [onClose]);

  // Al renombrar la app, las claves pasaron de `smartfood_*` a `tuki_*`. Se copia
  // lo que el comensal ya tenía guardado para que no pierda sus datos.
  useEffect(() => {
    (['user_basic', 'addresses'] as const).forEach((sufijo) => {
      const nueva = getStorageKey(sufijo);
      if (localStorage.getItem(nueva) !== null) return;
      const valor = localStorage.getItem(claveComensal(sufijo, usuarioId, PREFIJO_CLAVE_ANTERIOR));
      if (valor !== null) localStorage.setItem(nueva, valor);
    });
  }, [getStorageKey, usuarioId]);

  useEffect(() => {
    let vigente = true;

    const cargar = async () => {
      const savedUser = localStorage.getItem(getStorageKey('user_basic'));
      let localNombre = '';
      let localTelefono = '';

      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          localNombre = parsed.nombre || '';
          localTelefono = parsed.telefono || '';
        } catch {
          // Un JSON corrupto no debe impedir pedir.
        }
      }

      const savedAddrs = localStorage.getItem(getStorageKey('addresses'));
      let locales: DireccionEstructurada[] = [];
      if (savedAddrs) {
        try {
          const parsed = JSON.parse(savedAddrs);
          if (Array.isArray(parsed)) locales = parsed;
        } catch {
          // Se ignora y se ofrece crear una dirección nueva.
        }
      }

      let deCuenta: string | null = null;
      let telefonoCuenta = '';
      if (usuarioId) {
        try {
          const { datos } = await apiCuenta.datosEnvio(usuarioId);
          if (datos && datosEnvioCompletos(datos)) {
            deCuenta = formatearDireccionEnvio(datos);
            telefonoCuenta = datos.telefono;
          }
        } catch {
          // Sin red, la copia local sigue siendo útil.
        }
      }

      if (!vigente) return;

      setNombre(localNombre || nombreCuentaMeta || '');
      setTelefono(localTelefono || telefonoCuenta);
      setDireccionCuenta(deCuenta);

      if (locales.length > 0) {
        setDireccionesGuardadas(locales);
        setDireccionSeleccionadaId(locales[0].id);
        setUsarDireccionCuenta(false);
        setModoDireccion('lista');
      } else if (deCuenta) {
        setDireccionesGuardadas([]);
        setDireccionSeleccionadaId(null);
        setUsarDireccionCuenta(true);
        setModoDireccion('lista');
      } else {
        setDireccionesGuardadas([]);
        setDireccionSeleccionadaId(null);
        setUsarDireccionCuenta(false);
        setModoDireccion('editar');
      }
    };

    void cargar();

    return () => {
      vigente = false;
    };
  }, [getStorageKey, usuarioId, nombreCuentaMeta]);

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(val)) {
      setNombre(val);
      if (errorEnvio) setErrorEnvio(null);
    }
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val) && val.length <= 10) {
      setTelefono(val);
      if (errorEnvio) setErrorEnvio(null);
    }
  };

  const iniciarNuevaDireccion = () => {
    setFormDir({ id: Date.now().toString(), alias: 'Casa', via: 'Calle', n1: '', n2: '', n3: '', barrio: '', complemento: '' });
    setUsarDireccionCuenta(false);
    setModoDireccion('editar');
  };

  const editarDireccion = (dir: DireccionEstructurada) => {
    setFormDir(dir);
    setUsarDireccionCuenta(false);
    setModoDireccion('editar');
  };

  const eliminarDireccion = (id: string) => {
    const nuevas = direccionesGuardadas.filter((d) => d.id !== id);
    setDireccionesGuardadas(nuevas);
    const addressesKey = getStorageKey('addresses');
    localStorage.setItem(addressesKey, JSON.stringify(nuevas));
    if (direccionSeleccionadaId === id) setDireccionSeleccionadaId(nuevas.length > 0 ? nuevas[0].id : null);
    if (nuevas.length === 0) {
      if (direccionCuenta) {
        setUsarDireccionCuenta(true);
        setModoDireccion('lista');
      } else {
        iniciarNuevaDireccion();
      }
    }
  };

  const guardarDireccion = () => {
    if (!formDir.n1 || !formDir.n2 || !formDir.n3 || !formDir.barrio) return;
    const nuevas = [...direccionesGuardadas];
    const index = nuevas.findIndex((d) => d.id === formDir.id);
    if (index >= 0) nuevas[index] = formDir;
    else nuevas.push(formDir);
    setDireccionesGuardadas(nuevas);
    const addressesKey = getStorageKey('addresses');
    localStorage.setItem(addressesKey, JSON.stringify(nuevas));
    setUsarDireccionCuenta(false);
    setDireccionSeleccionadaId(formDir.id);
    setModoDireccion('lista');
    if (errorEnvio) setErrorEnvio(null);
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
      if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s#\-.]*$/.test(val)) return;
    }
    setFormDir((prev) => ({ ...prev, [field]: val }));
  };

  const corregirOrtografiaBarrio = async (valor: string) => {
    if (!valor || valor.trim().length < 2) return;
    if (corrigiendoBarrio) return;
    setCorrigiendoBarrio(true);
    try {
      const respuesta = await generarTextoIA(
        `Corrige la ortografía de este barrio o localidad colombiana: "${valor}". Responde SOLO con el nombre del barrio corregido, sin explicaciones ni texto adicional. Si el nombre ya está correcto, devuélvelo tal cual.`,
        "Eres un experto en geografía y ortografía de barrios y localidades colombianas. Corrige solo errores ortográficos, mantén el nombre original si está correcto.",
      );
      const barrioCorregido = respuesta.trim().replace(/^["']|["']$/g, '').trim();
      if (barrioCorregido && barrioCorregido.length >= 2) {
        setFormDir((prev) => ({ ...prev, barrio: barrioCorregido }));
      }
    } catch {
      // silencioso
    } finally {
      setCorrigiendoBarrio(false);
    }
  };

  const handleBarrioBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const valor = e.target.value.trim();
    if (valor && valor.length >= 2) await corregirOrtografiaBarrio(valor);
  };

  const isFormValid = () => {
    if (nombre.trim().length < 3) return false;
    if (telefono.length !== 10) return false;
    if (modoDireccion === 'editar') {
      if (!formDir.n1 || !formDir.n2 || !formDir.n3 || !formDir.barrio) return false;
    } else if (!(usarDireccionCuenta && direccionCuenta)) {
      if (direccionSeleccionadaId === null) return false;
    }
    return true;
  };

  const getValidationErrors = () => {
    const errors: string[] = [];
    if (nombre.trim().length < 3) errors.push('El nombre debe tener al menos 3 caracteres');
    if (telefono.length !== 10) errors.push('El teléfono debe tener 10 dígitos');
    if (modoDireccion === 'editar') {
      if (!formDir.n1) errors.push('Falta el número principal de la dirección');
      if (!formDir.n2) errors.push('Falta el número secundario de la dirección');
      if (!formDir.n3) errors.push('Falta el número adicional de la dirección');
      if (!formDir.barrio) errors.push('Falta el barrio de la dirección');
    } else if (!(usarDireccionCuenta && direccionCuenta)) {
      if (direccionSeleccionadaId === null) errors.push('Debes seleccionar o crear una dirección de entrega');
    }
    return errors;
  };

  const formatDireccion = (d: DireccionEstructurada) => {
    return `${d.via} ${d.n1} # ${d.n2} - ${d.n3}, ${d.barrio} ${d.complemento ? `(${d.complemento})` : ''}`;
  };

  const handleEnviarWhatsApp = () => {
    if (!localAbierto) return;
    if (!isFormValid()) {
      setErrorEnvio(getValidationErrors().join('. '));
      return;
    }
    setErrorEnvio(null);
    if (modoDireccion === 'editar') guardarDireccion();
    const userKey = getStorageKey('user_basic');
    localStorage.setItem(userKey, JSON.stringify({ nombre, telefono }));

    let direccionStr = 'Sin dirección';
    if (usarDireccionCuenta && direccionCuenta) {
      direccionStr = direccionCuenta;
    } else {
      let dirSeleccionada = direccionesGuardadas.find((d) => d.id === direccionSeleccionadaId);
      if (!dirSeleccionada && modoDireccion === 'editar') {
        const addressesKey = getStorageKey('addresses');
        const savedAddrs = localStorage.getItem(addressesKey);
        if (savedAddrs) {
          const parsed = JSON.parse(savedAddrs);
          dirSeleccionada = parsed[parsed.length - 1];
        }
      }
      if (dirSeleccionada) direccionStr = formatDireccion(dirSeleccionada);
    }
    const items = carrito.map((item) => ({
      platillo_id: item.platillo.id,
      nombre: item.platillo.nombre,
      cantidad: item.cantidad,
      precio: item.platillo.precio,
    }));
    const resultadoAPI = apiWhatsApp.generarLinkPedido(
      { nombre: restaurante.nombre, telefono: restaurante.whatsapp },
      { nombre, direccion: direccionStr, telefono },
      { items, total },
    );
    window.open(resultadoAPI.url, '_blank');

    // Copia del pedido para el historial. WhatsApp ya se abrió: si esto falla
    // (sin sesión, sin red) el pedido sigue su curso y el comensal no ve un
    // error por una función secundaria.
    if (user && restauranteId) {
      void apiPedidos
        .crear({
          restauranteId,
          nombre,
          telefono,
          direccion: direccionStr,
          items,
          total,
        })
        .catch(() => undefined);
    }

    onPedidoEnviado?.(carrito[0]?.platillo.id);
    onClose();
  };

  // ---------- Sub-componentes ----------

  // Funciones de render, no componentes: al estar definidas dentro de
  // `ModalCarrito`, cada render crearía un tipo nuevo y React desmontaría el
  // subárbol (los campos perdían el foco a cada tecla).
  const CarritoItem = ({ item }: { item: { platillo: Platillo; cantidad: number } }) => (
    <div className="flex gap-4 p-3 rounded-[16px] items-center relative"
      style={{
        backgroundColor: e.surface,
        border: `1px solid ${e.border}`,
      }}>
      {item.platillo.imagen_url ? (
        <img src={item.platillo.imagen_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center" style={{ backgroundColor: e.bg, color: e.muted }}>
          <ShoppingCart size={22} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm leading-tight mb-1 line-clamp-2" style={{ color: e.title }}>{item.platillo.nombre}</h4>
        <div className="font-bold text-base tabular-nums" style={{ color: e.precio }}>${(item.platillo.precio * item.cantidad).toLocaleString()}</div>
      </div>
      <div className="flex flex-col items-end justify-between h-full gap-2 shrink-0 self-stretch">
        <button
          type="button"
          onClick={() => onRemove(item.platillo.id)}
          aria-label={`Quitar ${item.platillo.nombre}`}
          className="p-1.5 rounded-lg af-pulsar"
          style={{ color: e.danger }}
        >
          <Trash2 size={16} />
        </button>
        <div className="flex items-center gap-1.5 rounded-xl px-1.5 py-1" style={{ backgroundColor: e.bg, border: `1px solid ${e.border}` }}>
          <button type="button" aria-label="Quitar una unidad" onClick={() => onUpdate(item.platillo.id, -1)} className="w-6 h-6 flex items-center justify-center af-pulsar" style={{ color: e.text }}>
            <Minus size={14} />
          </button>
          <span className="text-sm font-bold w-4 text-center tabular-nums">{item.cantidad}</span>
          <button type="button" aria-label="Añadir una unidad" onClick={() => onUpdate(item.platillo.id, 1)} className="w-6 h-6 flex items-center justify-center af-pulsar" style={{ color: e.text }}>
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  const DireccionItem = ({ dir }: { dir: DireccionEstructurada }) => {
    const elegida = direccionSeleccionadaId === dir.id;
    return (
      <div
        onClick={() => {
          setUsarDireccionCuenta(false);
          setDireccionSeleccionadaId(dir.id);
        }}
        className="p-3 rounded-xl border-2 cursor-pointer flex items-center gap-3 relative group"
        style={{
          borderColor: elegida ? e.primary : 'transparent',
          backgroundColor: elegida ? e.accentSoft : e.surface,
        }}
      >
        <div
          className="p-2 rounded-full shrink-0"
          style={elegida
            ? { backgroundColor: e.primary, color: e.onPrimary }
            : { backgroundColor: e.bg, color: e.muted }}
        >
          {dir.alias === 'Casa' ? <Home size={16} /> : dir.alias === 'Trabajo' ? <Briefcase size={16} /> : <MapPin size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase mb-0.5" style={{ color: e.muted }}>{dir.alias}</p>
          <p className="text-sm font-medium break-words" style={{ color: e.text }}>{formatDireccion(dir)}</p>
        </div>
        {/* Siempre visibles: en pantalla táctil no existe el hover. */}
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            aria-label="Editar dirección"
            onClick={(ev) => { ev.stopPropagation(); editarDireccion(dir); }}
            className="p-1.5 rounded-lg af-pulsar"
            style={{ color: e.accentText }}
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            aria-label="Eliminar dirección"
            onClick={(ev) => { ev.stopPropagation(); eliminarDireccion(dir.id); }}
            className="p-1.5 rounded-lg af-pulsar"
            style={{ color: e.danger }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  const ResumenVista = () => (
    <div className="space-y-4">
      {carrito.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center opacity-70 space-y-6 py-16">
          <div className="p-8 rounded-full" style={{ backgroundColor: e.surface }}>
            <ShoppingCart size={52} strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-lg text-af-ink">Tu carrito está vacío.</p>
          <button onClick={onClose} className="text-sm font-bold af-pulsar flex items-center gap-2" style={{ color: e.accentText }}>
            Volver al menú <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div>
          <div className="space-y-3">
            {carrito.map((item) => (
              <React.Fragment key={item.platillo.id}>{CarritoItem({ item })}</React.Fragment>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <button
              type="button"
              onClick={vaciarCarrito}
              className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 af-pulsar"
              style={{ color: e.danger }}
            >
              <Trash2 size={14} /> Vaciar carrito
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const DatosVista = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: e.muted }}>
          <User size={14} /> Tus datos
        </h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 rounded-xl border transition-colors focus-within:border-af-accent-text" style={{ borderColor: e.border, backgroundColor: e.surface }}>
            <User size={18} className="mr-3 shrink-0" style={{ color: e.muted }} />
            <input value={nombre} onChange={handleNombreChange} placeholder="Tu nombre completo" maxLength={LIMITES.REST_NOMBRE} className="bg-transparent outline-none w-full text-sm font-medium placeholder:opacity-50" style={{ color: e.text }} />
          </div>
          <div className="flex items-center p-3 rounded-xl border transition-colors focus-within:border-af-accent-text" style={{ borderColor: e.border, backgroundColor: e.surface }}>
            <Phone size={18} className="mr-3 shrink-0" style={{ color: e.muted }} />
            <input type="tel" value={telefono} onChange={handleTelefonoChange} placeholder="Número celular (10 dígitos)" maxLength={10} className="bg-transparent outline-none w-full text-sm font-medium placeholder:opacity-50" style={{ color: e.text }} />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t" style={{ borderColor: e.border }}>
        <div className="flex justify-between items-center gap-3">
          <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: e.muted }}>
            <MapPin size={14} /> Dirección de entrega
          </h3>
          {modoDireccion === 'lista' && direccionesGuardadas.length > 0 && (
            <button type="button" onClick={iniciarNuevaDireccion} className="text-xs font-bold flex items-center gap-1 shrink-0 af-pulsar" style={{ color: e.accentText }}>
              <Plus size={14} /> Nueva
            </button>
          )}
        </div>

        {errorEnvio && (
          <div className="p-3 rounded-xl border" style={{ backgroundColor: e.dangerSoft, borderColor: e.danger }}>
            <p className="text-xs font-bold mb-1" style={{ color: e.danger }}>Atención:</p>
            <p className="text-xs" style={{ color: e.danger }}>{errorEnvio}</p>
          </div>
        )}

        {modoDireccion === 'lista' ? (
          <div className="space-y-3">
            {direccionCuenta && (
              <button
                type="button"
                onClick={() => {
                  setUsarDireccionCuenta(true);
                  setDireccionSeleccionadaId(null);
                }}
                aria-pressed={usarDireccionCuenta}
                className="w-full p-3 rounded-xl border-2 cursor-pointer flex items-center gap-3 text-left af-pulsar"
                style={{
                  borderColor: usarDireccionCuenta ? e.primary : 'transparent',
                  backgroundColor: usarDireccionCuenta ? e.accentSoft : e.surface,
                }}
              >
                <div
                  className="p-2 rounded-full shrink-0"
                  style={usarDireccionCuenta
                    ? { backgroundColor: e.primary, color: e.onPrimary }
                    : { backgroundColor: e.bg, color: e.muted }}
                >
                  <MapPin size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase mb-0.5" style={{ color: e.muted }}>
                    Guardada en mi cuenta
                  </p>
                  <p className="text-sm font-medium break-words" style={{ color: e.text }}>
                    {direccionCuenta}
                  </p>
                </div>
              </button>
            )}

            {direccionesGuardadas.map((dir) => (
              <React.Fragment key={dir.id}>{DireccionItem({ dir })}</React.Fragment>
            ))}
            {!direccionCuenta && direccionesGuardadas.length === 0 && (
              <div className="text-center py-6 text-sm rounded-xl border border-dashed" style={{ color: e.muted, borderColor: e.border }}>
                No tienes direcciones guardadas.
              </div>
            )}
          </div>
        ) : (
          <>{FormaDireccionVista()}</>
        )}
      </div>
    </div>
  );

  const FormaDireccionVista = () => (
    <div className="p-4 rounded-[20px] space-y-4 border" style={{ backgroundColor: e.surface, borderColor: e.border }}>
      <div className="flex gap-2 overflow-x-auto pb-2 af-sin-scrollbar">
        {['Casa', 'Trabajo', 'Pareja', 'Otro'].map((alias) => {
          const activo = formDir.alias === alias;
          return (
            <button
              key={alias}
              type="button"
              onClick={() => setFormDir((prev) => ({ ...prev, alias }))}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border shrink-0 af-pulsar"
              style={activo
                ? { backgroundColor: e.primary, color: e.onPrimary, borderColor: e.primary }
                : { borderColor: e.border, color: e.muted }}
            >
              {alias}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <select value={formDir.via} onChange={(ev) => handleFormDirChange('via', ev.target.value)} className="p-2 rounded-lg text-sm outline-none border min-w-[100px]" style={{ backgroundColor: e.bg, color: e.text, borderColor: e.border }}>
          {VIAS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <input placeholder="#" value={formDir.n1} onChange={(ev) => handleFormDirChange('n1', ev.target.value)} className="flex-1 min-w-[50px] max-w-[60px] p-2 rounded-lg text-center text-sm outline-none border" style={{ backgroundColor: e.bg, color: e.text, borderColor: e.border }} />
        <span className="font-bold text-lg shrink-0" style={{ color: e.muted }}>#</span>
        <input placeholder="#" value={formDir.n2} onChange={(ev) => handleFormDirChange('n2', ev.target.value)} className="flex-1 min-w-[50px] max-w-[60px] p-2 rounded-lg text-center text-sm outline-none border" style={{ backgroundColor: e.bg, color: e.text, borderColor: e.border }} />
        <span className="font-bold text-lg shrink-0" style={{ color: e.muted }}>-</span>
        <input placeholder="#" value={formDir.n3} onChange={(ev) => handleFormDirChange('n3', ev.target.value)} className="flex-1 min-w-[50px] max-w-[60px] p-2 rounded-lg text-center text-sm outline-none border" style={{ backgroundColor: e.bg, color: e.text, borderColor: e.border }} />
      </div>
      <div className="relative">
        <input placeholder="Barrio (Ej: El Poblado)" value={formDir.barrio} onChange={(ev) => handleFormDirChange('barrio', ev.target.value)} onBlur={handleBarrioBlur} disabled={corrigiendoBarrio} className="w-full p-3 rounded-lg text-sm outline-none border disabled:opacity-50" style={{ backgroundColor: e.bg, color: e.text, borderColor: e.border }} />
        {corrigiendoBarrio && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-af-accent-text border-t-transparent rounded-full animate-spin" /></div>
        )}
      </div>
      <input placeholder="Detalles (Apto, Torre, casa...)" value={formDir.complemento} onChange={(ev) => handleFormDirChange('complemento', ev.target.value)} maxLength={LIMITES.ADDR_TEXT} className="w-full p-3 rounded-lg text-sm outline-none border" style={{ backgroundColor: e.bg, color: e.text, borderColor: e.border }} />

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => setModoDireccion('lista')} className="flex-1 py-2.5 text-xs font-bold af-pulsar" style={{ color: e.muted }}>Cancelar</button>
        <button
          type="button"
          onClick={guardarDireccion}
          disabled={!formDir.n1 || !formDir.n2 || !formDir.n3 || !formDir.barrio}
          className="flex-1 py-2.5 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 af-pulsar"
          style={{ backgroundColor: e.primary, color: e.onPrimary }}
        >
          <Save size={14} /> Guardar dirección
        </button>
      </div>
    </div>
  );

  const FooterVista = () => (
    <div className="p-6 border-t shrink-0" style={{ borderColor: e.border, backgroundColor: e.surface }}>
      <div className="flex justify-between items-end mb-5">
        <span className="text-sm font-bold uppercase tracking-wider" style={{ color: e.muted }}>Total a pagar</span>
        <span className="text-3xl font-bold font-title tabular-nums" style={{ color: e.precio }}>${total.toLocaleString()}</span>
      </div>

      {paso === 'resumen' ? (
        <button
          type="button"
          onClick={() => { setPaso('datos'); setErrorEnvio(null); }}
          disabled={!localAbierto}
          className="w-full py-4 rounded-[20px] font-bold text-base flex items-center justify-center gap-2 af-pulsar disabled:cursor-not-allowed"
          style={localAbierto
            ? { backgroundColor: e.primary, color: e.onPrimary }
            : { backgroundColor: e.surface, color: e.muted }}
        >
          {localAbierto ? (
            <>
              Continuar compra <ArrowRight size={20} />
            </>
          ) : 'Restaurante cerrado'}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleEnviarWhatsApp}
          disabled={!isFormValid() || !localAbierto}
          className="w-full py-4 rounded-[20px] font-bold text-base flex items-center justify-center gap-2 af-pulsar disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: e.success, color: e.onSuccess }}
        >
          {localAbierto ? (
            <>
              <LogoWhatsApp className="w-5 h-5" fill="currentColor" /> Enviar pedido por WhatsApp
            </>
          ) : (
            <>
              <Lock size={18} /> Cerrado - no se envían pedidos
            </>
          )}
        </button>
      )}
    </div>
  );

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tu pedido"
      className="fixed inset-0 z-[200] flex justify-end isolate"
      style={variablesAf({ bg: estilos.bg, text: estilos.text, title: estilos.title, primary: estilos.primary, secondary: estilos.secondary }) as React.CSSProperties}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm af-entrada-velo" onClick={onClose} />

      <div className="relative w-full max-w-md h-full flex flex-col overflow-hidden af-entrada-panel"
        style={{
          backgroundColor: e.bg,
          color: e.text,
          boxShadow: isDark ? '-10px 0 30px rgba(0,0,0,0.7)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        }}>
        <div className="p-5 sm:p-6 border-b flex justify-between items-center gap-3 shrink-0" style={{ borderColor: e.border }}>
          <div className="flex items-center gap-3 min-w-0">
            {paso === 'datos' && (
              <button type="button" aria-label="Volver al resumen" onClick={() => setPaso('resumen')} className="p-2 rounded-full shrink-0 af-pulsar" style={{ color: e.text }}>
                <ChevronLeft size={20} />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold font-title truncate" style={{ color: e.title }}>
                {paso === 'resumen' ? 'Tu pedido' : 'Datos de envío'}
              </h2>
              <p className="text-xs font-bold uppercase tracking-wider truncate" style={{ color: e.muted }}>{restaurante.nombre}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 rounded-full shrink-0 af-pulsar" style={{ color: e.muted }}>
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 relative af-sin-scrollbar">
          {paso === 'resumen' ? <>{ResumenVista()}</> : <>{DatosVista()}</>}
        </div>

        {carrito.length > 0 && <>{FooterVista()}</>}
      </div>
    </div>,
    document.body,
  );
};
