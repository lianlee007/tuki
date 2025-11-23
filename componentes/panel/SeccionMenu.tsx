
import React from 'react';
import { Platillo } from '../../tipos';
import { Boton } from '../ui';
import { Plus, Power, EyeOff, Pencil, Trash2 } from 'lucide-react';

interface SeccionMenuProps {
    platillos: Platillo[];
    setEditandoPlatillo: (p: Partial<Platillo>) => void;
    toggleEstadoPlatillo: (p: Platillo) => void;
    eliminarPlatillo: (id: string) => void;
}

export const SeccionMenu: React.FC<SeccionMenuProps> = ({ platillos, setEditandoPlatillo, toggleEstadoPlatillo, eliminarPlatillo }) => {
    
    const platillosAgrupados = platillos.reduce((acc, p) => {
        const cat = p.categoria || 'Sin Categoría';
        if(!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
    }, {} as Record<string, Platillo[]>);

    const handleEdit = (p: Platillo) => {
        setEditandoPlatillo(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        eliminarPlatillo(id);
    };

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-primary">Gestor de Platillos</h2>
                    <p className="text-sm text-text-muted">Organiza tu carta digital</p>
                </div>
                <Boton onClick={() => { setEditandoPlatillo({}); window.scrollTo({ top: 0, behavior: 'smooth' }); }} icono={<Plus size={18}/>} className="w-full sm:w-auto">Añadir Platillo</Boton>
            </div>

            {Object.entries(platillosAgrupados).map(([categoria, items]: [string, Platillo[]]) => (
                <section key={categoria} className="space-y-4">
                    <h3 className="text-xl font-serif font-bold text-text-main border-b border-white/5 pb-2">{categoria}</h3>
                    <div className="grid gap-3">
                         {/* Header Tabla (Solo Desktop) */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-text-muted uppercase tracking-wider items-center">
                            <div className="col-span-5">Nombre</div>
                            <div className="col-span-3">Precio</div>
                            <div className="col-span-2 text-center">Estado</div>
                            <div className="col-span-2 text-right">Acciones</div>
                        </div>

                        {items.map(platillo => (
                            <div 
                                key={platillo.id} 
                                className={`neumorphic p-4 grid grid-cols-12 gap-4 items-center hover:border-primary/30 border transition-all 
                                    ${!platillo.visible ? 'opacity-50 grayscale' : !platillo.disponible ? 'opacity-80' : ''} 
                                    border-transparent relative`}
                            >
                                <div className="col-span-12 md:col-span-5 flex items-center gap-4">
                                    <div className="relative w-12 h-12 shrink-0">
                                        <img src={platillo.imagen_url || "https://via.placeholder.com/150"} className="w-12 h-12 rounded-lg object-cover shadow-md" alt={platillo.nombre} />
                                        {!platillo.visible && (
                                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                                <EyeOff size={16} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm truncate">{platillo.nombre}</p>
                                        <p className="text-[10px] text-text-muted truncate">{platillo.ingredientes?.join(', ')}</p>
                                        {/* Precio Móvil */}
                                        <p className="md:hidden font-mono text-xs text-secondary font-bold mt-1">${platillo.precio.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="hidden md:block col-span-3 font-mono text-sm text-secondary">
                                    ${platillo.precio.toLocaleString()}
                                </div>

                                {/* Estado */}
                                <div className="col-span-6 md:col-span-2 flex md:justify-center mt-2 md:mt-0">
                                    <button 
                                        type="button"
                                        onClick={() => toggleEstadoPlatillo(platillo)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-inner border
                                        ${platillo.disponible && platillo.visible 
                                            ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                                            : !platillo.disponible && platillo.visible 
                                            ? 'bg-red-600/10 text-red-600 border-red-600/30' 
                                            : 'bg-gray-500/10 text-gray-400 border-gray-500/30'}
                                        `}
                                    >
                                        {platillo.visible ? <Power size={18} /> : <EyeOff size={18} />}
                                    </button>
                                </div>

                                {/* Acciones */}
                                <div className="col-span-6 md:col-span-2 flex justify-end gap-2 mt-2 md:mt-0">
                                    <button 
                                        type="button"
                                        onClick={() => handleEdit(platillo)} 
                                        className="p-2 hover:bg-white/5 rounded-lg text-blue-400 transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil size={18}/>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={(e) => handleDelete(e, platillo.id)} 
                                        className="p-2 hover:bg-white/5 rounded-lg text-red-400 transition-colors z-10 cursor-pointer"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};
