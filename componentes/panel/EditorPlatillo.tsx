
import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Platillo } from '../../tipos';
import { PlatilloSchema, PlatilloFormValues } from '../../tipos/esquemas';
import { Boton, Input, Textarea, Tarjeta } from '../ui';
import { Wand2, DollarSign, Upload, EyeOff, Save, Power, AlertCircle, SpellCheck, Loader2 } from 'lucide-react';
import { LIMITES } from '../../constantes';

interface EditorPlatilloProps {
    platillo: Partial<Platillo>;
    setPlatillo: Dispatch<SetStateAction<Partial<Platillo> | null>>;
    guardar: (p: Partial<Platillo>) => void;
    cancelar: () => void;
    sugerirIA: (prompt: string, setter: (val: string) => void) => Promise<void>;
    handleImagenUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    guardando: boolean;
    restauranteNombre: string;
}

const CATEGORIAS_ESTANDAR = [
    "Entradas", "Platos Fuertes", "Postres", "Bebidas", "Desayunos", "Almuerzos", "Cenas",
    "Comida Rápida", "Hamburguesas", "Pizza", "Sushi", "Tacos", "Mariscos", "Carnes", 
    "Pollo", "Pastas", "Ensaladas", "Sopas", "Vegano", "Vegetariano", "Sin Gluten", 
    "Infantil", "Vinos", "Licores", "Cafetería", "Panadería", "Especialidades", 
    "Oriental", "Árabe", "Típica"
].sort();

export const EditorPlatillo: React.FC<EditorPlatilloProps> = ({ 
    platillo, setPlatillo, guardar, cancelar, sugerirIA, handleImagenUpload, guardando, restauranteNombre 
}) => {
    
    // --- SETUP REACT HOOK FORM ---
    const { register, handleSubmit, setValue, watch, formState: { errors }, trigger } = useForm<PlatilloFormValues>({
        resolver: zodResolver(PlatilloSchema),
        defaultValues: {
            nombre: platillo.nombre || '',
            descripcion: platillo.descripcion || '',
            precio: platillo.precio || 0,
            categoria: platillo.categoria || '',
            imagen_url: platillo.imagen_url || '',
            ingredientes: platillo.ingredientes || [],
            visible: platillo.visible !== false,
            disponible: platillo.disponible !== false,
            destacado: platillo.destacado || false
        }
    });

    const [ingredientesTemp, setIngredientesTemp] = useState(platillo.ingredientes?.join(', ') || '');
    const [precioDisplay, setPrecioDisplay] = useState(platillo.precio ? platillo.precio.toLocaleString('es-CO') : '');
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [loadingImage, setLoadingImage] = useState(false);

    const formValues = watch();

    const onSubmit = (data: PlatilloFormValues) => {
        // Limpiar ingredientes finales antes de guardar
        const rawIng = ingredientesTemp.split(',').map(i => i.trim()).filter(Boolean);
        // Filtrar caracteres no permitidos en ingredientes una última vez
        const cleanIng = rawIng.map(i => i.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, ''));
        
        const finalData = { ...data, ingredientes: cleanIng };
        guardar({ ...platillo, ...finalData });
    };

    // --- VALIDACIÓN EN TIEMPO REAL (INPUT MASKING) ---

    // Nombre: Solo letras y espacios
    const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(val)) {
            setValue('nombre', val);
            trigger('nombre');
        }
    };

    // Descripción: Letras, números, espacios, puntos y comas
    const handleDescripcionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        if (/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,]*$/.test(val)) {
            setValue('descripcion', val);
            trigger('descripcion');
        }
    };

    // Ingredientes: Letras, números y comas (para separar)
    const handleIngredientesInput = (val: string) => {
        // Permitimos comas para separar visualmente, pero el regex interno valida cada item
        if (/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s,]*$/.test(val)) {
            const valCap = val.charAt(0).toUpperCase() + val.slice(1);
            setIngredientesTemp(valCap);
            // Actualizar el array en el formulario para validación de esquema
            const arrayIng = valCap.split(',').map(i => i.trim()).filter(Boolean);
            setValue('ingredientes', arrayIng);
            trigger('ingredientes');
        }
    };

    // Precio: Solo números, formato con puntos
    const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Eliminar todo lo que no sea número
        const rawVal = e.target.value.replace(/\D/g, '');
        
        if (rawVal === '') {
            setPrecioDisplay('');
            setValue('precio', 0);
            return;
        }

        const numVal = parseInt(rawVal, 10);
        
        // Limite duro de UI para no romper formato (opcional, esquema ya valida 200k)
        if (numVal > 9999999) return; 

        // Formatear con puntos
        const formatted = numVal.toLocaleString('es-CO');
        setPrecioDisplay(formatted);
        setValue('precio', numVal);
        trigger('precio'); // Disparar validación (min 1000, max 200000)
    };

    const onImageWrapperChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoadingImage(true);
        try {
            await handleImagenUpload(e);
        } finally {
            setLoadingImage(false);
        }
    };

    useEffect(() => {
        if (platillo.imagen_url) {
            setValue('imagen_url', platillo.imagen_url);
            trigger('imagen_url');
        }
    }, [platillo.imagen_url, setValue, trigger]);


    // --- IA ---
    const runIA = async (actionName: string, logic: () => Promise<void>) => {
        setLoadingAction(actionName);
        await logic();
        setLoadingAction(null);
    };

    const iaOrtografia = () => runIA('ortografia', () => sugerirIA(
        `Corrige ortografía del platillo: "${watch('nombre')}". Devuelve SOLO texto, sin números ni símbolos raros.`,
        (val) => {
            const clean = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            setValue('nombre', clean);
        }
    ));

    const iaDesc = () => runIA('descripcion', () => sugerirIA(
        `Descripción corta para "${watch('nombre')}" con ingredientes: "${ingredientesTemp}". Max ${LIMITES.PLATILLO_DESC} chars. Solo letras y números.`,
        (val) => {
            const clean = val.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,]/g, '');
            setValue('descripcion', clean);
        }
    ));

    const iaIng = () => runIA('ingredientes', () => sugerirIA(
        `5 ingredientes para "${watch('nombre')}". Separados por coma. Solo letras y números.`,
        (val) => {
            const clean = val.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s,]/g, '');
            handleIngredientesInput(clean);
        }
    ));

    const iaCategoria = () => runIA('categoria', () => sugerirIA(
        `Analiza este platillo y sugiere la categoría más adecuada de esta lista: ${CATEGORIAS_ESTANDAR.join(', ')}.

Nombre del platillo: "${watch('nombre')}"
Descripción: "${watch('descripcion')}"
Ingredientes: "${ingredientesTemp}"

Responde SOLO con el nombre exacto de UNA categoría de la lista proporcionada. No agregues explicaciones ni texto adicional, solo el nombre de la categoría.`,
        (val) => {
            // Limpiar la respuesta y buscar coincidencia exacta en las categorías
            const clean = val.trim().replace(/^["']|["']$/g, '').trim();
            // Buscar coincidencia exacta o parcial (case-insensitive)
            const categoriaEncontrada = CATEGORIAS_ESTANDAR.find(
                cat => cat.toLowerCase() === clean.toLowerCase() || 
                       clean.toLowerCase().includes(cat.toLowerCase()) ||
                       cat.toLowerCase().includes(clean.toLowerCase())
            );
            if (categoriaEncontrada) {
                setValue('categoria', categoriaEncontrada);
                trigger('categoria');
            }
        }
    ));

    return (
        <div className="animate-fadeIn grid lg:grid-cols-2 gap-8 mb-12">
            <div className="space-y-8">
                <section>
                    <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                        {platillo.id ? 'Editar Información' : 'Nuevo Platillo'}
                    </h3>
                    <Tarjeta className="space-y-6 border border-white/5">
                        {/* NOMBRE */}
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2 ml-1 flex justify-between items-center">
                                <span>Nombre del Plato <span className="text-red-500">*</span></span>
                                {watch('nombre')?.length > 2 && (
                                    <button type="button" onClick={iaOrtografia} disabled={guardando} className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-lg border border-blue-500/20 flex gap-1">
                                        {loadingAction === 'ortografia' ? <Loader2 size={12} className="animate-spin"/> : <SpellCheck size={12}/>} Ortografía
                                    </button>
                                )}
                            </label>
                            <Input 
                                value={watch('nombre')}
                                onChange={handleNombreChange}
                                placeholder="Ej: Hamburguesa Clásica"
                                maxLength={LIMITES.PLATILLO_NOMBRE}
                                className={errors.nombre ? "!border-red-500 border-opacity-100" : ""}
                            />
                            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
                        </div>

                        {/* ESTADO */}
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2 ml-1">Estado</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button type="button" onClick={() => { setValue('visible', true); setValue('disponible', true); }} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${watch('visible') && watch('disponible') ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-surface border-white/10 text-text-muted'}`}><Power size={20} /><span className="text-xs font-bold">Disponible</span></button>
                                <button type="button" onClick={() => { setValue('visible', true); setValue('disponible', false); }} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${watch('visible') && !watch('disponible') ? 'bg-red-600/20 border-red-600 text-red-600' : 'bg-surface border-white/10 text-text-muted'}`}><Power size={20} /><span className="text-xs font-bold">Agotado</span></button>
                                <button type="button" onClick={() => { setValue('visible', false); }} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${!watch('visible') ? 'bg-gray-500/20 border-gray-500 text-gray-400' : 'bg-surface border-white/10 text-text-muted'}`}><EyeOff size={20} /><span className="text-xs font-bold">Oculto</span></button>
                            </div>
                        </div>

                        {/* INGREDIENTES */}
                        <div>
                             <label className="block text-sm font-medium text-text-muted mb-2 ml-1 flex justify-between items-center">
                                <span>Ingredientes <span className="text-red-500">*</span></span>
                                <button type="button" onClick={iaIng} disabled={guardando} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg flex gap-1 border border-primary/20">
                                    {loadingAction === 'ingredientes' ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>} IA
                                </button>
                            </label>
                            <Textarea 
                                value={ingredientesTemp}
                                onChange={(e) => handleIngredientesInput(e.target.value)}
                                placeholder="Ingrediente 1, Ingrediente 2..."
                                maxLength={LIMITES.INGREDIENTES}
                                className={errors.ingredientes ? "!border-red-500" : ""}
                            />
                            {errors.ingredientes && <p className="text-red-500 text-xs mt-1">{errors.ingredientes.message}</p>}
                        </div>

                        {/* DESCRIPCIÓN */}
                        <div>
                             <label className="block text-sm font-medium text-text-muted mb-2 ml-1 flex justify-between items-center">
                                <span>Descripción <span className="text-red-500">*</span></span>
                                <button type="button" onClick={iaDesc} disabled={guardando} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg flex gap-1 border border-primary/20">
                                    {loadingAction === 'descripcion' ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>} IA
                                </button>
                            </label>
                            <Textarea 
                                value={watch('descripcion')}
                                onChange={handleDescripcionChange}
                                maxLength={LIMITES.PLATILLO_DESC} 
                                placeholder="Descripción irresistible..."
                                className={errors.descripcion ? "!border-red-500" : ""}
                            />
                            {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion.message}</p>}
                        </div>

                        {/* CATEGORÍA */}
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2 ml-1 flex justify-between items-center">
                                <span>Categoría <span className="text-red-500">*</span></span>
                                {(watch('nombre')?.length > 2 || watch('descripcion')?.length > 5 || ingredientesTemp.length > 0) && (
                                    <button type="button" onClick={iaCategoria} disabled={guardando} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg flex gap-1 border border-primary/20">
                                        {loadingAction === 'categoria' ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>} IA
                                    </button>
                                )}
                            </label>
                            <div className="relative">
                                <select
                                    {...register('categoria')}
                                    className={`w-full neumorphic-inset px-4 py-3 outline-none text-text-main bg-transparent focus:ring-2 focus:ring-primary/30 rounded-xl appearance-none ${errors.categoria ? "!border-red-500 border" : "border border-transparent"}`}
                                >
                                    <option value="" disabled className="bg-surface">Selecciona...</option>
                                    {CATEGORIAS_ESTANDAR.map((cat, i) => (
                                        <option key={i} value={cat} className="bg-surface text-text-main">{cat}</option>
                                    ))}
                                </select>
                            </div>
                            {errors.categoria && <p className="text-red-500 text-xs mt-1">{errors.categoria.message}</p>}
                        </div>
                    </Tarjeta>
                </section>
            </div>

            <div className="space-y-8">
                <section>
                    <h3 className="text-lg font-bold text-primary mb-4">Precio e Imagen</h3>
                    <Tarjeta className="space-y-6 border border-white/5">
                        {/* PRECIO */}
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2 ml-1">Precio (COP) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Input 
                                    type="text"
                                    value={precioDisplay}
                                    onChange={handlePrecioChange}
                                    icon={<DollarSign size={16}/>} 
                                    placeholder="0" 
                                    className={`font-mono font-bold ${errors.precio ? "!border-red-500" : ""}`}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-text-muted mt-1 px-1">
                                <span>Mín: 1.000</span>
                                {errors.precio ? <span className="text-red-500 font-bold">{errors.precio.message}</span> : <span>Máx: 200.000</span>}
                            </div>
                        </div>

                        {/* IMAGEN */}
                        <div className={`neumorphic-inset p-4 rounded-xl border flex flex-col items-center gap-4 relative ${errors.imagen_url ? "!border-red-500 bg-red-500/5" : "border-white/5"}`}>
                            {watch('imagen_url') ? (
                                <img src={watch('imagen_url')} className="w-full h-48 object-cover rounded-xl shadow-lg" alt="Preview" />
                            ) : (
                                <div className="w-full h-48 rounded-xl bg-bg flex flex-col items-center justify-center text-text-muted border-2 border-dashed border-white/10">
                                    <EyeOff size={32} className="opacity-50 mb-2"/>
                                    <span className="text-xs">Sin imagen</span>
                                </div>
                            )}
                            {loadingImage && <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-10"><Loader2 size={48} className="text-white animate-spin" /></div>}
                            <label className="cursor-pointer neumorphic-btn px-6 py-2 text-sm rounded-lg flex items-center gap-2 w-full justify-center">
                                <Upload size={16} /> {loadingImage ? 'Subiendo...' : 'Subir Imagen'}
                                <input type="file" accept="image/*" className="hidden" onChange={onImageWrapperChange} disabled={loadingImage} />
                            </label>
                        </div>
                        {errors.imagen_url && <p className="text-red-500 text-xs text-center">La imagen es obligatoria para publicar.</p>}
                    </Tarjeta>
                </section>
            </div>

            <div className="lg:col-span-2 flex justify-end gap-4 pt-6 border-t border-white/10">
                <Boton type="button" variante="secundario" onClick={cancelar} className="!bg-transparent border border-white/10">Cancelar</Boton>
                <Boton type="button" onClick={handleSubmit(onSubmit)} cargando={guardando} icono={<Save size={18} />}>
                    {platillo.id ? 'Guardar Cambios' : 'Crear Platillo'}
                </Boton>
            </div>
        </div>
    );
};
