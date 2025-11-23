
/**
 * Descripción: Panel principal donde el usuario gestiona su restaurante, menú y diseño.
 */
import React, { useState } from 'react';
import { useAuth } from '../contexto/ContextoAutenticacion';
import { subirImagen, generarContenidoIA } from '../lib/servicios';
import { Restaurante, Tema, Platillo } from '../tipos';
import { Menu, Wand2, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { PlantillaRestaurante } from '../componentes/restaurante/PlantillaRestaurante';
import { BarraLateral } from '../componentes/panel/BarraLateral';
import { SeccionDifusion } from '../componentes/panel/SeccionDifusion';
import { SeccionInfo } from '../componentes/panel/SeccionInfo';
import { SeccionDiseno } from '../componentes/panel/SeccionDiseno';
import { SeccionMenu } from '../componentes/panel/SeccionMenu';
import { EditorPlatillo } from '../componentes/panel/EditorPlatillo';
import { useDatosPanel } from '../hooks/useDatosPanel';
import { apiRestaurante } from '../servicios/apiRestaurante';
import { apiPlatillos } from '../servicios/apiPlatillos';
import { LIMITES } from '../constantes';

// Helper para mensajes de error
export const formatError = (e: any): string => {
  if (!e) return "Error desconocido";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  if (typeof e === "object") {
    return e.message || e.error_description || e.details || JSON.stringify(e);
  }
  return String(e);
};

export default function PanelControl() {
  const { user } = useAuth();
  // Hook personalizado para traer toda la data del restaurante
  const { cargando, restaurante, setRestaurante, tema, setTema, platillos, setPlatillos, mensaje, mostrarMensaje, cargarDatos } = useDatosPanel(user);

  // Estados de interfaz
  const [tabActiva, setTabActiva] = useState<'info' | 'tema' | 'menu' | 'difusion'>('info');
  const [guardando, setGuardando] = useState(false);
  const [vistaPreviaAbierta, setVistaPreviaAbierta] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [editandoPlatillo, setEditandoPlatillo] = useState<Partial<Platillo> | null>(null);

  // Estado para modal de confirmación
  const [idEliminar, setIdEliminar] = useState<string | null>(null);

  // Guardado parcial silencioso (sin blocking UI)
  const guardarRestauranteSilencioso = async (datosActualizados?: Partial<Restaurante>) => {
    if (!restaurante) return;
    const datosAGuardar = datosActualizados ? { ...restaurante, ...datosActualizados } : restaurante;
    setGuardando(true);
    try {
      const { error } = await apiRestaurante.actualizar(restaurante.id, datosAGuardar);
      if (error) throw error;
      if (datosActualizados) setRestaurante(datosAGuardar as Restaurante);
    } catch (error) { console.error(error); } finally { setGuardando(false); }
  };

  // Aplicar cambios visuales
  const aplicarTema = async (nuevoTema: Partial<Tema>) => {
    if (!tema) return;
    setTema({ ...tema, ...nuevoTema });
    setGuardando(true);
    try {
      const { error } = await apiRestaurante.actualizarTema(tema.id, nuevoTema);
      if (error) throw error;
      mostrarMensaje('exito', `Estilo aplicado correctamente`);
    } catch (error: any) {
      console.error("Error aplicando tema:", error);
      mostrarMensaje('error', formatError(error));
    } finally { setGuardando(false); }
  };

  // Manejo de subida de imágenes
  const handleImagenUpload = async (e: React.ChangeEvent<HTMLInputElement>, campo: 'logo' | 'banner' | 'platillo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await subirImagen(file);
      if (campo === 'logo' && restaurante) { setRestaurante({ ...restaurante, imagen_logo_url: url }); await guardarRestauranteSilencioso({ imagen_logo_url: url }); }
      else if (campo === 'banner' && restaurante) { setRestaurante({ ...restaurante, imagen_banner_url: url }); await guardarRestauranteSilencioso({ imagen_banner_url: url }); }
      else if (campo === 'platillo' && editandoPlatillo) { setEditandoPlatillo({ ...editandoPlatillo, imagen_url: url }); }
    } catch (error: any) { mostrarMensaje('error', formatError(error)); }
  };

  // CRUD Platillos
  const guardarPlatillo = async (platillo: Partial<Platillo>) => {
    if (!restaurante) return;
    setGuardando(true);
    try {
      const { error } = await apiPlatillos.guardar({ ...platillo, restaurante_id: restaurante.id });
      if (error) throw error;
      mostrarMensaje('exito', 'Platillo guardado'); setEditandoPlatillo(null); cargarDatos();
    } catch (e: any) { mostrarMensaje('error', formatError(e)); } finally { setGuardando(false); }
  };

  const iniciarEliminacion = (id: string) => {
    setIdEliminar(id);
  };

  const confirmarEliminacion = async () => {
    if (!idEliminar) return;
    setGuardando(true);
    try {
      const { error } = await apiPlatillos.eliminar(idEliminar);
      if (error) throw error;
      setPlatillos(prev => prev.filter(p => p.id !== idEliminar));
      mostrarMensaje('exito', 'Platillo eliminado correctamente');
      setIdEliminar(null);
    } catch (e: any) {
      mostrarMensaje('error', formatError(e));
    } finally {
      setGuardando(false);
    }
  };

  const toggleEstadoPlatillo = async (p: Platillo) => {
    let nuevoDisponible = p.disponible; let nuevoVisible = p.visible;
    if (p.disponible && p.visible) { nuevoDisponible = false; nuevoVisible = true; }
    else if (!p.disponible && p.visible) { nuevoDisponible = false; nuevoVisible = false; }
    else { nuevoDisponible = true; nuevoVisible = true; }
    setPlatillos(prev => prev.map(item => item.id === p.id ? { ...item, disponible: nuevoDisponible, visible: nuevoVisible } : item));
    try { await apiPlatillos.actualizarEstado(p.id, nuevoDisponible, nuevoVisible); } catch (e: any) { mostrarMensaje('error', formatError(e)); cargarDatos(); }
  };

  // Integración IA
  const sugerirIA = async (prompt: string, setter: (val: string) => void) => {
    setGuardando(true);
    try { const res = await generarContenidoIA(prompt); setter(res.replace(/^["']|["']$/g, '').replace(/\.$/, '')); }
    catch (e: any) { mostrarMensaje('error', `IA Error: ${formatError(e)}`); } finally { setGuardando(false); }
  }

  if (cargando && !restaurante) return <div className="min-h-screen flex items-center justify-center bg-bg"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <div className="flex h-screen bg-bg text-text-main font-sans overflow-hidden transition-colors duration-300">
      {/* Overlay Móvil */}
      {menuMovilAbierto && <div className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm" onClick={() => setMenuMovilAbierto(false)} />}

      {/* Sidebar de Navegación */}
      <BarraLateral tabActiva={tabActiva} setTabActiva={(tab) => { setTabActiva(tab); setEditandoPlatillo(null); setMenuMovilAbierto(false); }} restaurante={restaurante} setVistaPreviaAbierta={setVistaPreviaAbierta} movilAbierto={menuMovilAbierto} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full">
        {/* Notificaciones Toast */}
        {mensaje && <div className={`absolute top-20 right-6 md:top-6 md:right-6 px-6 py-4 rounded-xl shadow-2xl text-white z-50 animate-slideIn border border-white/10 backdrop-blur-md ${mensaje.tipo === 'exito' ? 'bg-green-500/90' : 'bg-red-500/90'}`}>{mensaje.texto}</div>}

        <header className="h-16 md:h-20 border-b border-white/5 bg-bg/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuMovilAbierto(!menuMovilAbierto)} className="md:hidden p-2 text-text-muted hover:text-primary rounded-lg"><Menu size={24} /></button>
            <div><h1 className="text-lg md:text-xl font-bold text-text-main font-serif flex items-center gap-2 line-clamp-1">{editandoPlatillo ? <><button type="button" onClick={() => setEditandoPlatillo(null)} className="hover:bg-white/5 p-1 rounded-full"><ArrowLeft size={20} /></button>{editandoPlatillo.id ? 'Editar' : 'Nuevo'}</> : (tabActiva === 'info' ? 'Configuración' : tabActiva === 'tema' ? 'Diseño' : tabActiva === 'menu' ? 'Menú' : 'Difusión')}</h1></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20"><Wand2 size={12} fill="currentColor" /> IA</div>
            <button onClick={() => setVistaPreviaAbierta(true)} className="md:hidden px-3 py-1.5 text-xs font-bold bg-surface border border-white/10 rounded-lg shadow-sm text-text-muted">Vista Previa</button>
          </div>
        </header>

        {/* Área de Contenido */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-20 scroll-smooth">
          <div className="max-w-6xl mx-auto space-y-8">
            {tabActiva === 'menu' && editandoPlatillo && restaurante ? <EditorPlatillo platillo={editandoPlatillo} setPlatillo={setEditandoPlatillo} guardar={guardarPlatillo} cancelar={() => setEditandoPlatillo(null)} sugerirIA={sugerirIA} handleImagenUpload={(e) => handleImagenUpload(e, 'platillo')} guardando={guardando} restauranteNombre={restaurante.nombre} /> : null}
            {tabActiva === 'info' && restaurante && !editandoPlatillo && <SeccionInfo restaurante={restaurante} setRestaurante={setRestaurante} guardarRestaurante={guardarRestauranteSilencioso} handleImagenUpload={handleImagenUpload} sugerirIA={sugerirIA} guardando={guardando} mostrarMensaje={mostrarMensaje} />}
            {tabActiva === 'tema' && tema && !editandoPlatillo && <SeccionDiseno tema={tema} aplicarTema={aplicarTema} guardando={guardando} />}
            {tabActiva === 'menu' && !editandoPlatillo && <SeccionMenu platillos={platillos} setEditandoPlatillo={setEditandoPlatillo} toggleEstadoPlatillo={toggleEstadoPlatillo} eliminarPlatillo={iniciarEliminacion} />}
            {tabActiva === 'difusion' && restaurante && <SeccionDifusion restaurante={restaurante} />}
          </div>
        </div>
      </main>

      {/* Vista Previa a Pantalla Completa */}
      {vistaPreviaAbierta && restaurante && tema && (
        <div className="fixed inset-0 z-[100] bg-black overflow-y-auto animate-fadeIn">
          <PlantillaRestaurante restaurante={restaurante} tema={tema} platillos={platillos.filter(p => p.disponible && p.visible)} modoPreview={true} onClosePreview={() => setVistaPreviaAbierta(false)} />
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {idEliminar && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="neumorphic p-8 max-w-sm w-full border-2 border-red-500/20 shadow-2xl relative animate-slideIn">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 animate-bounce">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-center mb-2 text-text-main">¿Eliminar platillo?</h3>
            <p className="text-center text-text-muted mb-8 text-sm leading-relaxed">
              Esta acción eliminará el platillo de tu menú permanentemente. No se puede deshacer.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIdEliminar(null)}
                disabled={guardando}
                className="flex-1 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-colors text-text-muted hover:text-text-main"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminacion}
                disabled={guardando}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                {guardando ? 'Borrando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
