import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Restaurante } from '../../tipos';
import { RestauranteSchema, RestauranteFormValues } from '../../tipos/esquemas';
import { Tarjeta, Input, Textarea, LogoWhatsApp, BotonCTA, BotonTexto } from '../ui';
import {
    Store, Upload, MapPin, Phone, Mail, Wand2, Clock, CalendarDays, AlertTriangle,
    SpellCheck, Loader2, CheckCircle2, AlertOctagon, Save, RotateCcw, UtensilsCrossed,
} from 'lucide-react';
import { LIMITES } from '../../constantes';
import { DEPARTAMENTOS, municipiosDe } from '../../lib/colombia';
import { generarContenidoGroq } from '../../lib/servicioGroq';
import { AsistenteIA, BotonIA } from './AsistenteIA';
import { SelectorCocina } from './SelectorCocina';

interface SeccionInfoProps {
    restaurante: Restaurante;
    guardarRestaurante: (datos?: Partial<Restaurante>) => Promise<void>;
    subirImagen: (file: File, destino?: 'platillos' | 'restaurantes' | 'resenas') => Promise<string>;
    sugerirIA: (prompt: string, setter: (val: string) => void) => Promise<void>;
    guardando: boolean;
    mostrarMensaje: (tipo: 'exito' | 'error', texto: string) => void;
}

const DIAS_UI = [
    { key: 'lunes', label: 'Lun', nombre: 'lunes' },
    { key: 'martes', label: 'Mar', nombre: 'martes' },
    { key: 'miercoles', label: 'Mié', nombre: 'miércoles' },
    { key: 'jueves', label: 'Jue', nombre: 'jueves' },
    { key: 'viernes', label: 'Vie', nombre: 'viernes' },
    { key: 'sabado', label: 'Sáb', nombre: 'sábado' },
    { key: 'domingo', label: 'Dom', nombre: 'domingo' },
] as const;

const SISTEMA_IA =
    'Eres un copywriter gastronómico profesional. Escribes en español neutro, breve y atractivo. ' +
    'Nunca usas comillas ni markdown: respondes solo con el texto pedido.';

/** Campos que deben estar completos para publicar el sitio. */
const CAMPOS_OBLIGATORIOS: { k: string; l: string }[] = [
    { k: 'nombre', l: 'Nombre' },
    { k: 'eslogan', l: 'Eslogan' },
    { k: 'descripcion', l: 'Descripción' },
    { k: 'imagen_logo_url', l: 'Logo' },
    { k: 'imagen_banner_url', l: 'Banner' },
    { k: 'telefono', l: 'Teléfono' },
    { k: 'email', l: 'Email' },
    { k: 'direccion', l: 'Dirección' },
    { k: 'departamento', l: 'Departamento' },
    { k: 'municipio', l: 'Municipio' },
    { k: 'ciudad', l: 'Ciudad' },
    { k: 'whatsapp', l: 'WhatsApp' },
    { k: 'horario_apertura', l: 'Horario de apertura' },
    { k: 'horario_cierre', l: 'Horario de cierre' },
    { k: 'dias_abierto', l: 'Días de servicio' },
];

/** Campos que validamos con zod (tienen un control en el formulario). */
const CAMPOS_FORM = [
    'nombre', 'eslogan', 'descripcion', 'telefono', 'email', 'direccion',
    'departamento', 'municipio', 'ciudad', 'whatsapp', 'horario_apertura', 'horario_cierre', 'dias_abierto',
];

const RE_DIRECCION = /^(\w+)\s+([A-Za-z0-9]+)\s+#\s+([A-Za-z0-9]+)\s+-\s+([A-Za-z0-9]+)(?:,\s*(.+))?$/;

/**
 * Título de grupo del formulario. Un icono pequeño con el tinte de marca
 * delante de la tinta, para que cada bloque se reconozca de un vistazo sin que
 * el color de marca inunde los encabezados.
 */
const TituloSeccion: React.FC<{ icono: React.ReactNode; children: React.ReactNode }> = ({ icono, children }) => (
    <h2 className="mb-5 flex items-center gap-3 text-base font-bold text-af-ink">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-af-accent/10 text-af-accent">
            {icono}
        </span>
        {children}
    </h2>
);

export const SeccionInfo: React.FC<SeccionInfoProps> = ({
    restaurante, guardarRestaurante, subirImagen, sugerirIA, guardando, mostrarMensaje,
}) => {
    const {
        register, handleSubmit, setValue, watch, reset,
        getFieldState,
        formState: { errors, isDirty },
    } = useForm<RestauranteFormValues>({
        resolver: zodResolver(RestauranteSchema),
        defaultValues: restaurante,
        mode: 'onBlur',
    });

    const [direccionParts, setDireccionParts] = useState({ tipo: 'Calle', n1: '', n2: '', n3: '', barrio: '' });
    const [imgLoading, setImgLoading] = useState<{ logo: boolean, banner: boolean }>({ logo: false, banner: false });
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [generandoIA, setGenerandoIA] = useState(false);
    const [mostrarErrores, setMostrarErrores] = useState(false);
    const [campoScroll, setCampoScroll] = useState<string | null>(null);
    const [ordenScroll, setOrdenScroll] = useState(0);

    // Las imágenes se suben al CDN al instante, pero solo se enlazan al
    // restaurante cuando se pulsa "Finalizar" (igual que el resto de campos).
    const [logoUrl, setLogoUrl] = useState(restaurante.imagen_logo_url || '');
    const [bannerUrl, setBannerUrl] = useState(restaurante.imagen_banner_url || '');

    useEffect(() => {
        if (restaurante?.direccion) {
            const parts = restaurante.direccion.match(RE_DIRECCION);
            if (parts) {
                setDireccionParts({ tipo: parts[1], n1: parts[2], n2: parts[3], n3: parts[4], barrio: parts[5] || '' });
            }
        }
    }, [restaurante.id]);

    // --- Validación ---------------------------------------------------------

    const esFaltante = (campo: string, valores: any): boolean => {
        if (campo === 'imagen_logo_url') return !logoUrl;
        if (campo === 'imagen_banner_url') return !bannerUrl;
        if (campo === 'dias_abierto') {
            const dias = valores?.dias_abierto as Record<string, boolean> | undefined;
            return !dias || !Object.values(dias).some(v => v === true);
        }
        if (campo === 'direccion') {
            const texto = String(valores?.direccion ?? '').trim();
            // Requiere algo más que "Calle # -": al menos un número.
            return texto.length < 5 || !/\d/.test(texto);
        }
        const valor = valores?.[campo];
        return valor === undefined || valor === null || String(valor).trim() === '';
    };

    const valoresForm = watch();
    const faltantes = CAMPOS_OBLIGATORIOS.filter(c => esFaltante(c.k, valoresForm));
    const estaPublicado = faltantes.length === 0;
    const totalCampos = CAMPOS_OBLIGATORIOS.length;
    const completos = totalCampos - faltantes.length;
    const nombreActual = String(valoresForm?.nombre ?? '').trim();

    /* Ubicación encadenada: el municipio depende del departamento elegido, así
       que no hay forma de escribir un par imposible. Al cambiar de departamento
       se limpia el municipio (y la ciudad, que se rellena con él). */
    const departamentoActual = String(valoresForm?.departamento ?? '');
    const municipios = useMemo(() => municipiosDe(departamentoActual), [departamentoActual]);

    const imagenCambiada =
        logoUrl !== (restaurante.imagen_logo_url || '') ||
        bannerUrl !== (restaurante.imagen_banner_url || '');

    const hayCambios = isDirty || imagenCambiada;

    const tieneError = (campo: string): boolean =>
        mostrarErrores && (Boolean((errors as any)[campo]) || esFaltante(campo, valoresForm));

    const irA = (campo: string) => {
        setMostrarErrores(true);
        setCampoScroll(campo);
        setOrdenScroll(n => n + 1);
    };

    // Desplazamiento suave hasta el primer campo con error.
    useEffect(() => {
        if (ordenScroll === 0 || !campoScroll) return;
        const el = document.getElementById(`campo-${campoScroll}`);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const focusable = el.querySelector<HTMLElement>('input:not([type="file"]), textarea, select');
        window.setTimeout(() => {
            if (focusable && focusable.offsetParent !== null) {
                focusable.focus({ preventScroll: true });
            } else {
                // Campos sin input visible (p. ej. subir logo): enfocamos el contenedor.
                el.setAttribute('tabindex', '-1');
                el.focus({ preventScroll: true });
            }
        }, 400);
    }, [ordenScroll]);

    const manejarInvalido = () => {
        const primero = CAMPOS_OBLIGATORIOS
            .map(c => c.k)
            .find(k => CAMPOS_FORM.includes(k) && getFieldState(k as any).invalid);
        irA(primero || faltantes[0]?.k || 'nombre');
        mostrarMensaje('error', 'Revisa los campos marcados en rojo.');
    };

    const handleFinalizar = async (data: RestauranteFormValues) => {
        const pendientes = CAMPOS_OBLIGATORIOS.filter(c => esFaltante(c.k, data));
        if (pendientes.length > 0) {
            irA(pendientes[0].k);
            mostrarMensaje(
                'error',
                pendientes.length === 1
                    ? `Falta completar: ${pendientes[0].l}.`
                    : `Faltan ${pendientes.length} campos por completar (marcados en rojo).`
            );
            return;
        }

        const datosCompletos = { ...data, imagen_logo_url: logoUrl, imagen_banner_url: bannerUrl };
        try {
            await guardarRestaurante(datosCompletos);
            reset(datosCompletos);
            setMostrarErrores(false);
            mostrarMensaje('exito', '¡Listo! Tu restaurante quedó guardado.');
        } catch (e: any) {
            mostrarMensaje('error', e?.message || 'No se pudo guardar. Revisa tu conexión.');
        }
    };

    const descartarCambios = () => {
        reset(restaurante);
        setLogoUrl(restaurante.imagen_logo_url || '');
        setBannerUrl(restaurante.imagen_banner_url || '');
        setMostrarErrores(false);
        if (restaurante.direccion) {
            const parts = restaurante.direccion.match(RE_DIRECCION);
            if (parts) setDireccionParts({ tipo: parts[1], n1: parts[2], n2: parts[3], n3: parts[4], barrio: parts[5] || '' });
        }
        mostrarMensaje('exito', 'Cambios descartados.');
    };

    // --- Manejo de campos ---------------------------------------------------

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, field: keyof RestauranteFormValues) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
        setValue(field, val, { shouldDirty: true, shouldValidate: true });
    };

    const handleDireccionChange = (field: 'tipo' | 'n1' | 'n2' | 'n3' | 'barrio', value: string) => {
        if ((field === 'n1' || field === 'n2' || field === 'n3') && !/^\d{0,4}[a-zA-Z]?$/.test(value)) return;
        const finalValue = field === 'barrio' ? value.charAt(0).toUpperCase() + value.slice(1) : value;
        const newParts = { ...direccionParts, [field]: finalValue };
        setDireccionParts(newParts);
        const barrioSuffix = newParts.barrio ? `, ${newParts.barrio}` : '';
        const fullDireccion = `${newParts.tipo} ${newParts.n1} # ${newParts.n2} - ${newParts.n3}${barrioSuffix}`;
        setValue('direccion', fullDireccion, { shouldDirty: true, shouldValidate: true });
    };

    const toggleDia = (key: keyof typeof restaurante.dias_abierto) => {
        const currentDias = { ...(watch('dias_abierto') || {}) } as Record<string, boolean>;
        const nuevosDias = { ...currentDias, [key]: !currentDias[key as string] };
        setValue('dias_abierto', nuevosDias as any, { shouldDirty: true, shouldValidate: true });
    };

    const wrapImagenUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'logo' | 'banner') => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImgLoading(prev => ({ ...prev, [tipo]: true }));
        try {
            const url = await subirImagen(file, 'restaurantes');
            if (tipo === 'logo') setLogoUrl(url); else setBannerUrl(url);
        } catch (error: any) {
            mostrarMensaje('error', error?.message || 'No se pudo subir la imagen.');
        } finally {
            setImgLoading(prev => ({ ...prev, [tipo]: false }));
            e.target.value = '';
        }
    };

    // --- IA -----------------------------------------------------------------

    const runIA = async (actionName: string, logic: () => Promise<void>) => {
        setLoadingAction(actionName);
        try { await logic(); } finally { setLoadingAction(null); }
    };

    /** Genera eslogan + descripción de una sola vez. */
    const autocompletarConIA = async () => {
        const nombre = (watch('nombre') || '').trim();
        if (nombre.length < 2) {
            irA('nombre');
            mostrarMensaje('error', 'Primero escribe el nombre de tu restaurante.');
            return;
        }
        setGenerandoIA(true);
        try {
            const [eslogan, descripcion] = await Promise.all([
                generarContenidoGroq(
                    `Crea un eslogan corto y memorable (máximo 6 palabras) para el restaurante "${nombre}". Devuelve solo el eslogan.`,
                    SISTEMA_IA
                ),
                generarContenidoGroq(
                    `Escribe una descripción breve y apetitosa (máximo 280 caracteres) para el restaurante "${nombre}". Devuelve solo la descripción.`,
                    SISTEMA_IA
                ),
            ]);
            if (eslogan) setValue('eslogan', eslogan, { shouldDirty: true, shouldValidate: true });
            if (descripcion) setValue('descripcion', descripcion, { shouldDirty: true, shouldValidate: true });
            mostrarMensaje('exito', 'Texto generado. Revísalo y pulsa Finalizar.');
        } catch (e: any) {
            mostrarMensaje('error', `IA: ${e?.message || 'no se pudo generar el texto.'}`);
        } finally {
            setGenerandoIA(false);
        }
    };

    const iaOrtografiaNombre = () => runIA('ortografia_nombre', () => sugerirIA(
        `Corrige la ortografía del nombre del restaurante: "${watch('nombre')}". Nombres como "Fogonzo" o "Rappi" son marcas válidas: no los cambies. Devuelve solo el nombre.`,
        (val) => setValue('nombre', val.trim(), { shouldDirty: true, shouldValidate: true })
    ));

    const sugerirEslogan = () => runIA('eslogan', () => sugerirIA(
        `Eslogan corto, memorable y elegante para "${watch('nombre')}". Máximo 6 palabras. Devuelve solo el eslogan.`,
        (val) => setValue('eslogan', val, { shouldDirty: true, shouldValidate: true })
    ));

    const sugerirDescripcion = () => runIA('descripcion', () => sugerirIA(
        `Descripción acogedora y apetitosa para "${watch('nombre')}". Máximo 300 caracteres. Devuelve solo la descripción.`,
        (val) => setValue('descripcion', val, { shouldDirty: true, shouldValidate: true })
    ));

    /* --- Ubicación ---------------------------------------------------------
       El municipio depende del departamento, así que el par elegido siempre
       existe. La ciudad se mantiene sincronizada con el municipio: las
       plantillas ya la usan ("Bogotá, Colombia") y así no hay dos verdades. */
    const elegirDepartamento = () => {
        setValue('municipio', '', { shouldDirty: true });
        setValue('ciudad', '', { shouldDirty: true });
    };

    const elegirMunicipio = (municipio: string) => {
        setValue('municipio', municipio, { shouldDirty: true, shouldValidate: true });
        setValue('ciudad', municipio, { shouldDirty: true, shouldValidate: true });
    };

    const claseError = (campo: string) => (tieneError(campo) ? '!border-af-danger' : '');

    /* ------------------------------------------------------------------ */

    return (
        <div className="space-y-10">

            {/* ---------- Estado de publicación ---------- */}
            <section className="rounded-[28px] bg-af-surface p-5 sm:p-6">
                <div className="flex items-start gap-4">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${estaPublicado ? 'bg-af-success/15 text-af-success' : 'bg-af-danger/10 text-af-danger-text'}`}>
                        {estaPublicado ? <CheckCircle2 size={22} /> : <AlertOctagon size={22} />}
                    </span>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base font-bold text-af-ink">
                            {estaPublicado ? 'Tu sitio está publicado' : 'Tu sitio aún no está publicado'}
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-af-ink-secondary">
                            {estaPublicado
                                ? 'Todo en orden. Tus clientes ya pueden ver el menú y pedir por WhatsApp.'
                                : 'Completa los campos obligatorios (*) y elige al menos un día de servicio para que tus clientes puedan entrar.'}
                        </p>

                        <div className="mt-4 flex items-center gap-3">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-af-ink/10">
                                <div
                                    className={`h-full rounded-full transition-transform duration-300 ease-out ${estaPublicado ? 'bg-af-success' : 'bg-af-accent'}`}
                                    style={{ transform: `scaleX(${completos / totalCampos})`, transformOrigin: 'left' }}
                                />
                            </div>
                            <span className="shrink-0 text-xs font-semibold tabular-nums text-af-ink-secondary">
                                {completos}/{totalCampos}
                            </span>
                        </div>

                        {!estaPublicado && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {faltantes.map(f => (
                                    <button
                                        key={f.k}
                                        type="button"
                                        onClick={() => irA(f.k)}
                                        title={`Ir a ${f.l}`}
                                        className="rounded-full bg-af-danger/10 px-3 py-1.5 text-xs font-semibold text-af-danger-text outline-none transition-colors duration-150 hover:bg-af-danger/20"
                                    >
                                        {f.l}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ---------- Asistente de IA ---------- */}
            <AsistenteIA
                titulo="Asistente de IA"
                descripcion="Con el nombre de tu restaurante, la IA redacta el eslogan y la descripción. Después corriges lo que quieras."
                principal={{
                    etiqueta: generandoIA ? 'Generando…' : 'Generar eslogan y descripción',
                    onClick: autocompletarConIA,
                    cargando: generandoIA,
                    disabled: generandoIA || guardando,
                }}
                nota={nombreActual.length < 2
                    ? 'Escribe primero el nombre de tu restaurante para activarlo.'
                    : undefined}
            />

            {/* ---------- Errores de validación ---------- */}
            {mostrarErrores && Object.keys(errors).length > 0 && (
                <section className="rounded-[24px] bg-af-danger/10 p-5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 shrink-0 text-af-danger-text" size={20} />
                        <div className="min-w-0">
                            <h3 className="font-bold text-af-ink">Revisa estos campos</h3>
                            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-af-ink-secondary">
                                {Object.values(errors).map((e: any, i) => <li key={i}>{e.message}</li>)}
                            </ul>
                        </div>
                    </div>
                </section>
            )}

            <form onSubmit={handleSubmit(handleFinalizar, manejarInvalido)} noValidate>

                {/* ---------- Información básica ---------- */}
                <section>
                    <TituloSeccion icono={<Store size={17} />}>Información básica</TituloSeccion>
                    <Tarjeta enlace={false} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div id="campo-nombre">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <label htmlFor="rest-nombre" className="text-sm font-medium text-af-ink">
                                        Nombre <span className="text-af-danger">*</span>
                                    </label>
                                    <BotonIA
                                        onClick={iaOrtografiaNombre}
                                        cargando={loadingAction === 'ortografia_nombre'}
                                        disabled={loadingAction !== null || guardando || nombreActual.length < 2}
                                        icono={<SpellCheck size={13} />}
                                    >
                                        Corregir
                                    </BotonIA>
                                </div>
                                <Input
                                    id="rest-nombre"
                                    {...register('nombre')}
                                    placeholder="Ej. La Sazón de la Abuela"
                                    maxLength={LIMITES.REST_NOMBRE}
                                    className={claseError('nombre')}
                                />
                                {tieneError('nombre')
                                    ? <p className="ml-1 mt-2 text-xs font-medium text-af-danger-text">Escribe el nombre de tu restaurante.</p>
                                    : <p className="ml-1 mt-2 text-xs text-af-ink-secondary">Aparece como título de tu menú.</p>}
                            </div>

                            <div id="campo-eslogan">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <label htmlFor="rest-eslogan" className="text-sm font-medium text-af-ink">
                                        Eslogan <span className="text-af-danger">*</span>
                                    </label>
                                    <BotonIA
                                        onClick={sugerirEslogan}
                                        cargando={loadingAction === 'eslogan'}
                                        disabled={loadingAction !== null || guardando || nombreActual.length < 2}
                                        icono={<Wand2 size={13} />}
                                    >
                                        Sugerir
                                    </BotonIA>
                                </div>
                                <Input
                                    id="rest-eslogan"
                                    {...register('eslogan')}
                                    placeholder="Ej. Tradición en cada bocado"
                                    maxLength={LIMITES.REST_ESLOGAN}
                                    className={claseError('eslogan')}
                                />
                                {tieneError('eslogan')
                                    ? <p className="ml-1 mt-2 text-xs font-medium text-af-danger-text">Añade un eslogan.</p>
                                    : <p className="ml-1 mt-2 text-xs text-af-ink-secondary">Una frase corta que resume tu cocina.</p>}
                            </div>
                        </div>

                        <div id="campo-descripcion">
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <label htmlFor="rest-descripcion" className="text-sm font-medium text-af-ink">
                                    Descripción <span className="text-af-danger">*</span>
                                </label>
                                <BotonIA
                                    onClick={sugerirDescripcion}
                                    cargando={loadingAction === 'descripcion'}
                                    disabled={loadingAction !== null || guardando || nombreActual.length < 2}
                                    icono={<Wand2 size={13} />}
                                >
                                    Sugerir
                                </BotonIA>
                            </div>
                            <Textarea
                                id="rest-descripcion"
                                {...register('descripcion')}
                                placeholder="Cuéntale a tus clientes qué hace especial a tu restaurante…"
                                maxLength={LIMITES.REST_DESC}
                                className={claseError('descripcion')}
                            />
                            {tieneError('descripcion')
                                ? <p className="ml-1 mt-2 text-xs font-medium text-af-danger-text">Añade una descripción.</p>
                                : <p className="ml-1 mt-2 text-xs text-af-ink-secondary">Se muestra en la cabecera de tu menú.</p>}
                        </div>
                    </Tarjeta>
                </section>

                {/* ---------- Tipo de cocina (Descubrir) ---------- */}
                <section className="mt-10">
                    <TituloSeccion icono={<UtensilsCrossed size={17} />}>Tipo de cocina</TituloSeccion>
                    <Tarjeta enlace={false}>
                        <SelectorCocina restauranteId={restaurante.id} />
                    </Tarjeta>
                </section>

                {/* ---------- Imágenes ---------- */}
                <section className="mt-10">
                    <TituloSeccion icono={<Upload size={17} />}>Logo y banner</TituloSeccion>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Tarjeta enlace={false} className={`flex flex-col items-center gap-4 ${tieneError('imagen_logo_url') ? 'bg-af-danger/10 ring-1 ring-af-danger/40' : ''}`}>
                            <div id="campo-imagen_logo_url" className="flex w-full flex-col items-center gap-3">
                                <span className="flex items-center gap-1 text-sm font-medium text-af-ink">
                                    Logo <span className="text-af-danger">*</span>
                                </span>
                                <div className="relative">
                                    {logoUrl ? (
                                        <img
                                            src={logoUrl}
                                            className="h-32 w-32 rounded-full border border-af/20 object-cover"
                                            alt="Logo del restaurante"
                                        />
                                    ) : (
                                        <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-af/30 text-center text-xs text-af-ink-secondary">
                                            Sin logo
                                        </div>
                                    )}
                                    {imgLoading.logo && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/25 dark:bg-white/20">
                                            <Loader2 size={30} className="animate-spin text-white" />
                                        </div>
                                    )}
                                </div>
                                <label className="btn-af h-10 cursor-pointer px-4 text-sm">
                                    <Upload size={15} /> Subir logo
                                    <input type="file" className="sr-only" accept="image/*" onChange={e => wrapImagenUpload(e, 'logo')} />
                                </label>
                                {tieneError('imagen_logo_url') && <span className="text-xs font-medium text-af-danger-text">El logo es obligatorio.</span>}
                            </div>
                        </Tarjeta>

                        <Tarjeta enlace={false} className={`flex flex-col items-center gap-4 ${tieneError('imagen_banner_url') ? 'bg-af-danger/10 ring-1 ring-af-danger/40' : ''}`}>
                            <div id="campo-imagen_banner_url" className="flex w-full flex-col items-center gap-3">
                                <span className="flex items-center gap-1 text-sm font-medium text-af-ink">
                                    Banner <span className="text-af-danger">*</span>
                                </span>
                                <div className="relative w-full">
                                    {bannerUrl ? (
                                        <img
                                            src={bannerUrl}
                                            className="h-32 w-full rounded-2xl border border-af/20 object-cover"
                                            alt="Banner del restaurante"
                                        />
                                    ) : (
                                        <div className="flex h-32 w-full items-center justify-center rounded-2xl border-2 border-dashed border-af/30 text-xs text-af-ink-secondary">
                                            Sin banner
                                        </div>
                                    )}
                                    {imgLoading.banner && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/25 dark:bg-white/20">
                                            <Loader2 size={30} className="animate-spin text-white" />
                                        </div>
                                    )}
                                </div>
                                <label className="btn-af h-10 cursor-pointer px-4 text-sm">
                                    <Upload size={15} /> Subir banner
                                    <input type="file" className="sr-only" accept="image/*" onChange={e => wrapImagenUpload(e, 'banner')} />
                                </label>
                                {tieneError('imagen_banner_url') && <span className="text-xs font-medium text-af-danger-text">El banner es obligatorio.</span>}
                            </div>
                        </Tarjeta>
                    </div>
                </section>

                {/* ---------- Ubicación y contacto ---------- */}
                <section className="mt-10">
                    <TituloSeccion icono={<MapPin size={17} />}>Ubicación y contacto</TituloSeccion>
                    <Tarjeta enlace={false} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div id="campo-telefono">
                                <label htmlFor="rest-telefono" className="mb-2 block text-sm font-medium text-af-ink">
                                    Teléfono <span className="text-af-danger">*</span>
                                    <span className="ml-1 text-xs font-normal text-af-ink-secondary">(10 dígitos)</span>
                                </label>
                                <Input
                                    id="rest-telefono"
                                    {...register('telefono')}
                                    onChange={(e) => handleNumericInput(e, 'telefono')}
                                    value={watch('telefono') || ''}
                                    icon={<Phone size={16} />}
                                    type="tel"
                                    inputMode="numeric"
                                    autoComplete="tel"
                                    prefix="+57"
                                    maxLength={LIMITES.REST_TELEFONO}
                                    className={claseError('telefono')}
                                    error={tieneError('telefono')}
                                    helper={tieneError('telefono') ? 'Debe tener 10 dígitos.' : undefined}
                                />
                            </div>
                            <div id="campo-email">
                                <label htmlFor="rest-email" className="mb-2 block text-sm font-medium text-af-ink">
                                    Email <span className="text-af-danger">*</span>
                                </label>
                                <Input
                                    id="rest-email"
                                    {...register('email', {
                                        validate: (value) => {
                                            if (!value || value.trim() === '') return true;
                                            return emailRegex.test(value) || 'Correo electrónico inválido';
                                        }
                                    })}
                                    type="email"
                                    icon={<Mail size={16} />}
                                    autoComplete="email"
                                    maxLength={LIMITES.REST_EMAIL}
                                    className={claseError('email')}
                                    error={tieneError('email')}
                                    helper={(errors.email?.message as string) || (tieneError('email') ? 'Escribe un correo válido.' : undefined)}
                                />
                            </div>
                        </div>

                        <div id="campo-direccion">
                            <label className="mb-2 block text-sm font-medium text-af-ink">
                                Dirección <span className="text-af-danger">*</span>
                            </label>
                            <div className={`flex flex-wrap items-center gap-2 rounded-2xl border bg-af-ground p-2 transition-colors focus-within:border-af-accent md:flex-nowrap ${tieneError('direccion') ? 'border-af-danger' : 'border-af/25'}`}>
                                <select
                                    value={direccionParts.tipo}
                                    onChange={(e) => handleDireccionChange('tipo', e.target.value)}
                                    aria-label="Tipo de vía"
                                    className="cursor-pointer rounded-xl bg-transparent px-3 py-2.5 text-sm font-medium text-af-ink outline-none"
                                >
                                    {['Calle', 'Carrera', 'Avenida', 'Transversal'].map(t => (
                                        <option key={t} className="bg-af-surface text-af-ink" value={t}>{t}</option>
                                    ))}
                                </select>
                                <input
                                    type="text" inputMode="numeric" value={direccionParts.n1}
                                    onChange={(e) => handleDireccionChange('n1', e.target.value)}
                                    placeholder="Nº" aria-label="Número principal" maxLength={LIMITES.ADDR_NUM}
                                    className="w-16 rounded-xl bg-af-surface px-2 py-2.5 text-center text-sm font-medium text-af-ink outline-none"
                                />
                                <span className="px-0.5 font-semibold text-af-ink-secondary">#</span>
                                <input
                                    type="text" inputMode="numeric" value={direccionParts.n2}
                                    onChange={(e) => handleDireccionChange('n2', e.target.value)}
                                    placeholder="Nº" aria-label="Número secundario" maxLength={LIMITES.ADDR_NUM}
                                    className="w-16 rounded-xl bg-af-surface px-2 py-2.5 text-center text-sm font-medium text-af-ink outline-none"
                                />
                                <span className="px-0.5 font-semibold text-af-ink-secondary">-</span>
                                <input
                                    type="text" inputMode="numeric" value={direccionParts.n3}
                                    onChange={(e) => handleDireccionChange('n3', e.target.value)}
                                    placeholder="Nº" aria-label="Número terciario" maxLength={LIMITES.ADDR_NUM}
                                    className="w-16 rounded-xl bg-af-surface px-2 py-2.5 text-center text-sm font-medium text-af-ink outline-none"
                                />
                                <input
                                    type="text" value={direccionParts.barrio}
                                    onChange={(e) => handleDireccionChange('barrio', e.target.value)}
                                    placeholder="Barrio" aria-label="Barrio" maxLength={LIMITES.ADDR_TEXT}
                                    className="min-w-[120px] flex-1 rounded-xl bg-af-surface px-3 py-2.5 text-sm text-af-ink outline-none"
                                />
                            </div>
                            {tieneError('direccion') && <p className="ml-1 mt-2 text-xs font-medium text-af-danger-text">Completa la dirección: tipo de vía, números y barrio.</p>}
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div id="campo-departamento">
                                <label htmlFor="rest-departamento" className="mb-2 block text-sm font-medium text-af-ink">
                                    Departamento <span className="text-af-danger">*</span>
                                </label>
                                <select
                                    id="rest-departamento"
                                    autoComplete="address-level1"
                                    className={`input-af h-11 cursor-pointer text-sm ${claseError('departamento')}`}
                                    {...register('departamento', { onChange: elegirDepartamento })}
                                >
                                    <option value="">Selecciona el departamento…</option>
                                    {DEPARTAMENTOS.map((d) => (
                                        <option key={d.nombre} value={d.nombre} className="bg-af-surface text-af-ink">
                                            {d.nombre}
                                        </option>
                                    ))}
                                </select>
                                {tieneError('departamento') && <p className="ml-1 mt-2 text-xs font-medium text-af-danger-text">Selecciona el departamento.</p>}
                            </div>

                            <div id="campo-municipio">
                                <label htmlFor="rest-municipio" className="mb-2 block text-sm font-medium text-af-ink">
                                    Municipio <span className="text-af-danger">*</span>
                                </label>
                                <select
                                    id="rest-municipio"
                                    autoComplete="address-level2"
                                    disabled={!departamentoActual}
                                    className={`input-af h-11 cursor-pointer text-sm disabled:cursor-not-allowed disabled:opacity-50 ${claseError('municipio')}`}
                                    {...register('municipio', { onChange: (e) => elegirMunicipio(e.target.value) })}
                                >
                                    <option value="">
                                        {departamentoActual ? 'Selecciona el municipio…' : 'Elige antes el departamento'}
                                    </option>
                                    {municipios.map((m) => (
                                        <option key={m} value={m} className="bg-af-surface text-af-ink">{m}</option>
                                    ))}
                                </select>
                                {tieneError('municipio')
                                    ? <p className="ml-1 mt-2 text-xs font-medium text-af-danger-text">Selecciona el municipio.</p>
                                    : <p className="ml-1 mt-2 text-xs text-af-ink-secondary">
                                        {municipios.length > 0
                                            ? `${municipios.length} municipios. La ciudad se rellena sola.`
                                            : 'Los 1.122 municipios del país.'}
                                    </p>}
                            </div>

                            <div id="campo-whatsapp">
                                <label htmlFor="rest-whatsapp" className="mb-2 block text-sm font-medium text-af-ink">
                                    WhatsApp <span className="text-af-danger">*</span>
                                    <span className="ml-1 text-xs font-normal text-af-ink-secondary">(10 dígitos)</span>
                                </label>
                                <Input
                                    id="rest-whatsapp"
                                    {...register('whatsapp')}
                                    onChange={(e) => handleNumericInput(e, 'whatsapp')}
                                    value={watch('whatsapp') || ''}
                                    icon={<LogoWhatsApp className="h-5 w-5" />}
                                    type="tel"
                                    inputMode="numeric"
                                    prefix="+57"
                                    maxLength={LIMITES.REST_TELEFONO}
                                    className={claseError('whatsapp')}
                                    error={tieneError('whatsapp')}
                                    helper={tieneError('whatsapp') ? 'Debe tener 10 dígitos.' : undefined}
                                />
                            </div>
                        </div>
                    </Tarjeta>
                </section>

                {/* ---------- Horarios ---------- */}
                <section className="mt-10">
                    <TituloSeccion icono={<Clock size={17} />}>Horarios</TituloSeccion>
                    <Tarjeta enlace={false} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div id="campo-horario_apertura">
                                <label htmlFor="rest-apertura" className="mb-2 block text-sm font-medium text-af-ink">
                                    Apertura <span className="text-af-danger">*</span>
                                </label>
                                <Input
                                    id="rest-apertura"
                                    type="time"
                                    {...register('horario_apertura')}
                                    icon={<Clock size={16} />}
                                    className={claseError('horario_apertura')}
                                />
                                {tieneError('horario_apertura') && <p className="ml-1 mt-2 text-xs font-medium text-af-danger-text">Indica la hora de apertura.</p>}
                            </div>
                            <div id="campo-horario_cierre">
                                <label htmlFor="rest-cierre" className="mb-2 block text-sm font-medium text-af-ink">
                                    Cierre <span className="text-af-danger">*</span>
                                </label>
                                <Input
                                    id="rest-cierre"
                                    type="time"
                                    {...register('horario_cierre')}
                                    icon={<Clock size={16} />}
                                    className={claseError('horario_cierre')}
                                />
                                {tieneError('horario_cierre') && <p className="ml-1 mt-2 text-xs font-medium text-af-danger-text">Indica la hora de cierre.</p>}
                            </div>
                        </div>

                        <div id="campo-dias_abierto">
                            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-af-ink">
                                <CalendarDays size={16} /> Días de servicio <span className="text-af-danger">*</span>
                            </label>
                            <div className={`flex flex-wrap gap-2 ${tieneError('dias_abierto') ? 'rounded-2xl bg-af-danger/10 p-3' : ''}`}>
                                {DIAS_UI.map((dia) => {
                                    const isOpen = watch(`dias_abierto.${dia.key}`);
                                    return (
                                        <button
                                            key={dia.key}
                                            type="button"
                                            onClick={() => toggleDia(dia.key as any)}
                                            aria-pressed={!!isOpen}
                                            aria-label={dia.nombre}
                                            title={dia.nombre}
                                            className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold outline-none transition-colors duration-200 ${
                                                isOpen
                                                    ? 'bg-af-accent text-white'
                                                    : 'bg-af-ground text-af-ink-secondary hover:bg-af-ink/[0.06] hover:text-af-ink'
                                            }`}
                                        >
                                            {dia.label}
                                        </button>
                                    );
                                })}
                            </div>
                            {tieneError('dias_abierto') && <p className="ml-1 mt-2 text-xs font-medium text-af-danger-text">Selecciona al menos un día.</p>}
                        </div>
                    </Tarjeta>
                </section>

                {/* ---------- Finalizar ----------
                    La misma banda que el editor de platillos: pegada abajo y
                    difuminada, para que guardar esté siempre a la vista sin
                    tapar el formulario. Sin relleno inferior en los ancestros
                    se ancla al borde mismo de la pantalla al llegar al final. */}
                <div className="sticky bottom-0 z-20 mt-10 flex items-center gap-2 bg-af-ground/85 px-4 py-3 backdrop-blur-xl sm:gap-3 sm:px-6 sm:py-4">
                    <p className="mr-auto hidden items-center gap-2 text-sm text-af-ink-secondary sm:flex">
                        {hayCambios ? (
                            <>
                                <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                                Tienes cambios sin guardar
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={16} className="shrink-0 text-af-success" />
                                Todo guardado
                            </>
                        )}
                    </p>
                    <div className="ml-auto flex flex-1 items-center gap-2 sm:flex-none sm:gap-3">
                        <BotonTexto
                            onClick={descartarCambios}
                            disabled={!hayCambios || guardando}
                            className="flex-1 justify-center sm:flex-none"
                        >
                            <RotateCcw size={14} /> Descartar
                        </BotonTexto>
                        <BotonCTA
                            type="submit"
                            cargando={guardando}
                            disabled={guardando}
                            iconoDerecho={<Save size={17} />}
                            className="flex-1 sm:flex-none"
                        >
                            Finalizar
                        </BotonCTA>
                    </div>
                </div>
            </form>
        </div>
    );
};
