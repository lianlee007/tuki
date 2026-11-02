import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
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
import { SelectorCocina, type SelectorCocinaRef } from './SelectorCocina';

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
    'Cuando se te indique un tipo de cocina, el texto debe sonar propio de esa cocina ' +
    '(ingredientes, platos y tradición), no una frase genérica que valdría para cualquier restaurante. ' +
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

/* Acepta letras en todas las partes de la dirección: "Calle 10A # 20B - 30C",
   "Vereda El Prado", "Kilómetro 5 # 2 - 10". Antes los números sólo admitían
   dígitos (y una única letra al final), así que una dirección real con
   "Bis", "A" o un punto kilométrico no se podía escribir. */
const RE_DIRECCION = /^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ.\s]+?)\s+([A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ-]+)\s*#\s*([A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ-]+)\s*[-–]\s*([A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ-]+)(?:,\s*(.+))?$/;

const DIAS_VACIOS = {
    lunes: false, martes: false, miercoles: false,
    jueves: false, viernes: false, sabado: false, domingo: false,
};

/**
 * La base devuelve `null` en las columnas de texto que aún no se llenaron, pero
 * los controles del formulario esperan cadenas. Se normaliza aquí, en el único
 * punto de entrada, para que ningún `input` reciba `null` y para que la
 * validación no confunda "vacío" con "dato roto".
 */
const valoresIniciales = (restaurante: Restaurante): RestauranteFormValues => ({
    ...restaurante,
    nombre: restaurante.nombre ?? '',
    eslogan: restaurante.eslogan ?? '',
    descripcion: restaurante.descripcion ?? '',
    telefono: restaurante.telefono ?? '',
    email: restaurante.email ?? '',
    direccion: restaurante.direccion ?? '',
    departamento: restaurante.departamento ?? '',
    municipio: restaurante.municipio ?? '',
    ciudad: restaurante.ciudad ?? '',
    whatsapp: restaurante.whatsapp ?? '',
    facebook: restaurante.facebook ?? '',
    instagram: restaurante.instagram ?? '',
    horario_apertura: restaurante.horario_apertura ?? '',
    horario_cierre: restaurante.horario_cierre ?? '',
    imagen_logo_url: restaurante.imagen_logo_url ?? '',
    imagen_banner_url: restaurante.imagen_banner_url ?? '',
    dias_abierto: restaurante.dias_abierto ?? DIAS_VACIOS,
});

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
        formState: { errors, isDirty },
    } = useForm<RestauranteFormValues>({
        resolver: zodResolver(RestauranteSchema),
        defaultValues: valoresIniciales(restaurante),
        mode: 'onBlur',
    });

    const [direccionParts, setDireccionParts] = useState({ tipo: 'Calle', n1: '', n2: '', n3: '', barrio: '' });
    const [imgLoading, setImgLoading] = useState<{ logo: boolean, banner: boolean }>({ logo: false, banner: false });
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [generandoIA, setGenerandoIA] = useState(false);
    const [mostrarErrores, setMostrarErrores] = useState(false);
    const [campoScroll, setCampoScroll] = useState<string | null>(null);
    const [ordenScroll, setOrdenScroll] = useState(0);

    // Las cocinas viven en su propio componente (consultan su catálogo), pero
    // ahora se guardan con el mismo "Finalizar y guardar" que el resto.
    const cocinaRef = useRef<SelectorCocinaRef>(null);
    const [cocinasCambiadas, setCocinasCambiadas] = useState(false);
    /* Nombres de las cocinas elegidas (principal + secundarias). La IA los usa
       como contexto para que el eslogan y la descripción hablen de la cocina
       real del restaurante y no de gastronomía en abstracto. */
    const [cocinasElegidas, setCocinasElegidas] = useState<string[]>([]);

    // Las imágenes se suben al CDN al instante, pero solo se enlazan al
    // restaurante al pulsar "Finalizar y guardar" (igual que el resto de campos).
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

    /** Fallos que el usuario puede ver ahora mismo, con su etiqueta legible. */
    const erroresVisibles = mostrarErrores
        ? CAMPOS_OBLIGATORIOS
            .filter(c => Boolean((errors as any)[c.k]) || esFaltante(c.k, valoresForm))
            .map(c => ({
                k: c.k,
                l: c.l,
                mensaje: String((errors as any)[c.k]?.message || 'Falta completar este campo.'),
            }))
        : [];

    /* Ubicación encadenada: el municipio depende del departamento elegido, así
       que no hay forma de escribir un par imposible. Al cambiar de departamento
       se limpia el municipio (y la ciudad, que se rellena con él). */
    const departamentoActual = String(valoresForm?.departamento ?? '');
    const municipios = useMemo(() => municipiosDe(departamentoActual), [departamentoActual]);

    const imagenCambiada =
        logoUrl !== (restaurante.imagen_logo_url || '') ||
        bannerUrl !== (restaurante.imagen_banner_url || '');

    const hayCambios = isDirty || imagenCambiada || cocinasCambiadas;

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

    const manejarInvalido = (errores: FieldErrors<RestauranteFormValues>) => {
        const conError = Object.keys(errores);
        // Orden del formulario, no orden en que zod encontró el fallo: así el
        // primer scroll lleva al campo más arriba, que es lo que espera quien
        // acaba de pulsar "Finalizar y guardar".
        const primero = CAMPOS_OBLIGATORIOS
            .map(c => c.k)
            .find(k => conError.includes(k) || esFaltante(k, valoresForm))
            || conError[0]
            || 'nombre';
        irA(primero);
        const etiqueta = CAMPOS_OBLIGATORIOS.find(c => c.k === primero)?.l || 'el formulario';
        const detalle = (errores as any)[primero]?.message;
        const pendientes = CAMPOS_OBLIGATORIOS.filter(
            c => conError.includes(c.k) || esFaltante(c.k, valoresForm)
        ).length;
        const restantes = pendientes > 1 ? ` Quedan ${pendientes} campos por revisar.` : '';
        mostrarMensaje(
            'error',
            detalle
                ? `${etiqueta}: ${detalle}.${restantes}`
                : `${etiqueta}: falta completarlo o tiene un dato inválido.${restantes}`
        );
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

        const datosCompletos = {
            ...data,
            imagen_logo_url: logoUrl,
            imagen_banner_url: bannerUrl,
        };
        try {
            await guardarRestaurante(datosCompletos);
            await cocinaRef.current?.guardar();
            reset(valoresIniciales({ ...restaurante, ...datosCompletos }));
            setMostrarErrores(false);
            mostrarMensaje('exito', 'Restaurante guardado. Tus cambios ya se ven en tu sitio.');
        } catch (e: any) {
            mostrarMensaje('error', e?.message || 'No se pudo guardar. Revisa tu conexión.');
        }
    };

    const descartarCambios = () => {
        reset(valoresIniciales(restaurante));
        setLogoUrl(restaurante.imagen_logo_url || '');
        setBannerUrl(restaurante.imagen_banner_url || '');
        cocinaRef.current?.descartar();
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
        // Los números de vía pueden llevar letras: 10A, 20 Bis, 30-32.
        if ((field === 'n1' || field === 'n2' || field === 'n3') && !/^[A-Za-z0-9 .-]{0,10}$/.test(value)) return;
        const finalValue = field === 'barrio' || field === 'tipo'
            ? value.charAt(0).toUpperCase() + value.slice(1)
            : value;
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

    /** Tipo de cocina en texto, tal como se lo pasamos a la IA. */
    const tipoCocina = cocinasElegidas.join(' y ');

    /** Los textos con IA necesitan nombre y cocina: sin cocina salen genéricos. */
    const puedeGenerarIA = nombreActual.length >= 2 && Boolean(tipoCocina);

    /** Nombre + cocina del restaurante, el contexto de todos los textos. */
    const contextoIA = () => ({
        nombre: String(watch('nombre') ?? '').trim(),
        cocina: tipoCocina,
        detalle: tipoCocina
            ? `Especialidad: cocina ${tipoCocina}.`
            : 'Todavía no eligió un tipo de cocina.',
    });

    /**
     * Genera eslogan + descripción de una sola vez, a partir del nombre y del
     * tipo de cocina. Sin cocina el resultado sería genérico, así que se pide
     * elegirla primero (el formulario ya va en ese orden).
     */
    const autocompletarConIA = async () => {
        const { nombre, cocina, detalle } = contextoIA();
        if (nombre.length < 2) {
            irA('nombre');
            mostrarMensaje('error', 'Primero escribe el nombre de tu restaurante.');
            return;
        }
        if (!cocina) {
            irA('cocina');
            mostrarMensaje('error', 'Elige el tipo de cocina para que los textos hablen de tu comida.');
            return;
        }
        setGenerandoIA(true);
        try {
            const [eslogan, descripcion] = await Promise.all([
                generarContenidoGroq(
                    `Crea un eslogan corto y memorable (máximo 6 palabras) para el restaurante "${nombre}". ` +
                    `${detalle} El eslogan debe evocar esa cocina concreta y no valer para cualquier negocio. ` +
                    'Devuelve solo el eslogan.',
                    SISTEMA_IA
                ),
                generarContenidoGroq(
                    `Escribe una descripción breve y apetitosa (máximo 280 caracteres) para el restaurante "${nombre}". ` +
                    `${detalle} Menciona el estilo de cocina y dos o tres platos o ingredientes típicos. ` +
                    'Tono cálido, en segunda persona, sin exageraciones. Devuelve solo la descripción.',
                    SISTEMA_IA
                ),
            ]);
            if (eslogan) setValue('eslogan', eslogan, { shouldDirty: true, shouldValidate: true });
            if (descripcion) setValue('descripcion', descripcion, { shouldDirty: true, shouldValidate: true });
            mostrarMensaje('exito', 'Texto generado. Revísalo y pulsa Finalizar y guardar.');
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
        `Eslogan corto, memorable y elegante para "${watch('nombre')}", restaurante de cocina ${tipoCocina || 'de autor'}. ` +
        'Máximo 6 palabras, con sabor a esa cocina. Devuelve solo el eslogan.',
        (val) => setValue('eslogan', val, { shouldDirty: true, shouldValidate: true })
    ));

    const sugerirDescripcion = () => runIA('descripcion', () => sugerirIA(
        `Descripción acogedora y apetitosa para "${watch('nombre')}", restaurante de cocina ${tipoCocina || 'de autor'}. ` +
        'Máximo 300 caracteres; nombra platos o ingredientes típicos de esa cocina. Devuelve solo la descripción.',
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

            {/* ---------- Errores de validación ---------- */}
            {erroresVisibles.length > 0 && (
                <section className="rounded-[24px] bg-af-danger/10 p-5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 shrink-0 text-af-danger-text" size={20} />
                        <div className="min-w-0">
                            <h3 className="font-bold text-af-ink">Revisa estos campos</h3>
                            <p className="mt-1 text-sm text-af-ink-secondary">
                                Toca uno para ir directo a corregirlo.
                            </p>
                            <ul className="mt-2 space-y-1 text-sm text-af-ink-secondary">
                                {erroresVisibles.map((e) => (
                                    <li key={e.k}>
                                        <button
                                            type="button"
                                            onClick={() => irA(e.k)}
                                            className="text-left underline decoration-af-danger/40 underline-offset-2 hover:text-af-ink"
                                        >
                                            <span className="font-semibold text-af-ink">{e.l}:</span> {e.mensaje}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>
            )}

            <form onSubmit={handleSubmit(handleFinalizar, manejarInvalido)} noValidate>

                {/* ---------- Nombre ---------- */}
                <section>
                    <TituloSeccion icono={<Store size={17} />}>Información básica</TituloSeccion>
                    <Tarjeta enlace={false}>
                        <div id="campo-nombre" className="max-w-xl">
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
                                ? <p className="ml-1 mt-2 text-xs font-medium text-af-danger-text">{(errors.nombre?.message as string) || 'Escribe el nombre de tu restaurante.'}</p>
                                : <p className="ml-1 mt-2 text-xs text-af-ink-secondary">Aparece como título de tu menú.</p>}
                        </div>
                    </Tarjeta>
                </section>

                {/* ---------- Tipo de cocina (Descubrir) ----------
                    Va justo después del nombre: es el contexto con el que la IA
                    redacta el eslogan y la descripción. */}
                <section className="mt-10">
                    <TituloSeccion icono={<UtensilsCrossed size={17} />}>Tipo de cocina</TituloSeccion>
                    <Tarjeta enlace={false}>
                        <SelectorCocina
                            ref={cocinaRef}
                            restauranteId={restaurante.id}
                            onCambios={setCocinasCambiadas}
                            onSeleccion={setCocinasElegidas}
                        />
                    </Tarjeta>
                </section>

                {/* ---------- Eslogan y descripción ---------- */}
                <section className="mt-10">
                    <TituloSeccion icono={<Wand2 size={17} />}>Eslogan y descripción</TituloSeccion>

                    <AsistenteIA
                        titulo="Textos con IA"
                        descripcion={
                            tipoCocina
                                ? `La IA redacta el eslogan y la descripción pensando en tu cocina ${tipoCocina}. Después corriges lo que quieras.`
                                : 'La IA redacta el eslogan y la descripción a partir de tu nombre y tu tipo de cocina.'
                        }
                        principal={{
                            etiqueta: generandoIA ? 'Generando…' : 'Generar eslogan y descripción',
                            onClick: autocompletarConIA,
                            cargando: generandoIA,
                            disabled: generandoIA || guardando || !puedeGenerarIA,
                        }}
                        nota={
                            nombreActual.length < 2
                                ? 'Escribe primero el nombre de tu restaurante para activarlo.'
                                : !tipoCocina
                                    ? 'Elige arriba el tipo de cocina para que los textos hablen de tu comida.'
                                    : undefined
                        }
                    />

                    <Tarjeta enlace={false} className="mt-5 space-y-6">
                        <div id="campo-eslogan">
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <label htmlFor="rest-eslogan" className="text-sm font-medium text-af-ink">
                                    Eslogan <span className="text-af-danger">*</span>
                                </label>
                                <BotonIA
                                    onClick={sugerirEslogan}
                                    cargando={loadingAction === 'eslogan'}
                                    disabled={loadingAction !== null || guardando || !puedeGenerarIA}
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
                                ? <p className="ml-1 mt-2 text-xs font-medium text-af-danger-text">{(errors.eslogan?.message as string) || 'Añade un eslogan.'}</p>
                                : <p className="ml-1 mt-2 text-xs text-af-ink-secondary">
                                    Una frase corta que resume tu cocina{tipoCocina ? ` (${tipoCocina})` : ''}.
                                </p>}
                        </div>

                        <div id="campo-descripcion">
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <label htmlFor="rest-descripcion" className="text-sm font-medium text-af-ink">
                                    Descripción <span className="text-af-danger">*</span>
                                </label>
                                <BotonIA
                                    onClick={sugerirDescripcion}
                                    cargando={loadingAction === 'descripcion'}
                                    disabled={loadingAction !== null || guardando || !puedeGenerarIA}
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
                                ? <p className="ml-1 mt-2 text-xs font-medium text-af-danger-text">{(errors.descripcion?.message as string) || 'Añade una descripción.'}</p>
                                : <p className="ml-1 mt-2 text-xs text-af-ink-secondary">
                                    Se muestra en la cabecera de tu menú. La IA la escribe según tu tipo de cocina.
                                </p>}
                        </div>
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
                                    helper={tieneError('telefono') ? ((errors.telefono?.message as string) || 'Debe tener 10 dígitos.') : undefined}
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
                                    {['Calle', 'Carrera', 'Avenida', 'Transversal', 'Diagonal', 'Circular', 'Kilómetro', 'Vereda', 'Manzana'].map(t => (
                                        <option key={t} className="bg-af-surface text-af-ink" value={t}>{t}</option>
                                    ))}
                                </select>
                                <input
                                    type="text" inputMode="text" value={direccionParts.n1}
                                    onChange={(e) => handleDireccionChange('n1', e.target.value)}
                                    placeholder="Nº" aria-label="Número principal" maxLength={LIMITES.ADDR_NUM}
                                    className="w-16 rounded-xl bg-af-surface px-2 py-2.5 text-center text-sm font-medium text-af-ink outline-none"
                                />
                                <span className="px-0.5 font-semibold text-af-ink-secondary">#</span>
                                <input
                                    type="text" inputMode="text" value={direccionParts.n2}
                                    onChange={(e) => handleDireccionChange('n2', e.target.value)}
                                    placeholder="Nº" aria-label="Número secundario" maxLength={LIMITES.ADDR_NUM}
                                    className="w-16 rounded-xl bg-af-surface px-2 py-2.5 text-center text-sm font-medium text-af-ink outline-none"
                                />
                                <span className="px-0.5 font-semibold text-af-ink-secondary">-</span>
                                <input
                                    type="text" inputMode="text" value={direccionParts.n3}
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
                            {tieneError('direccion') && <p className="ml-1 mt-2 text-xs font-medium text-af-danger-text">{(errors.direccion?.message as string) || 'Completa la dirección: tipo de vía, números y barrio.'}</p>}
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
                                    helper={tieneError('whatsapp') ? ((errors.whatsapp?.message as string) || 'Debe tener 10 dígitos.') : undefined}
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
                            disabled={guardando || !hayCambios}
                            iconoDerecho={hayCambios ? <Save size={17} /> : <CheckCircle2 size={17} />}
                            className="flex-1 sm:flex-none"
                        >
                            {hayCambios ? 'Finalizar y guardar' : 'Todo guardado'}
                        </BotonCTA>
                    </div>
                </div>
            </form>
        </div>
    );
};
