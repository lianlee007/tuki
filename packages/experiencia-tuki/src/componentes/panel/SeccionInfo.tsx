import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Restaurante } from '../../tipos';
import { RestauranteSchema, RestauranteFormValues } from '../../tipos/esquemas';
import { Input, Textarea, LogoWhatsApp, BotonCTA, BotonTexto } from '../ui';
import {
    Store, Upload, MapPin, Phone, Mail, Wand2, Clock, CalendarDays, AlertTriangle,
    SpellCheck, Loader2, CheckCircle2, Save, RotateCcw, UtensilsCrossed,
    ExternalLink, ImagePlus, CircleDashed, ChevronRight,
} from 'lucide-react';
import { LIMITES } from '../../constantes';
import { DEPARTAMENTOS, municipiosDe } from '../../lib/colombia';
import { generarTextoIA } from '../../lib/servicioIA';
import { AsistenteIA, BotonIA } from './AsistenteIA';
import { SelectorCocina, type SelectorCocinaRef } from './SelectorCocina';
import { AnilloProgreso, Chip, FilaDato, TarjetaSeccion } from './PanelUI';
import { generarSlugUnico } from '../../lib/utils';
import { urlPublica } from '../../lib/urlPublica';

/** Un dato obligatorio y el bloque del formulario al que pertenece. */
export interface CampoPublicacion {
    k: string;
    l: string;
    grupo: string;
}

export interface EstadoPublicacion {
    /** Datos obligatorios que aún están vacíos. */
    faltantes: CampoPublicacion[];
    /** Los mismos datos ya completos, para poder celebrarlos en el resumen. */
    listos: CampoPublicacion[];
    completos: number;
    total: number;
    estaPublicado: boolean;
    irA: (campo: string) => void;
}

interface SeccionInfoProps {
    restaurante: Restaurante;
    guardarRestaurante: (datos?: Partial<Restaurante>) => Promise<void>;
    subirImagen: (file: File, destino?: 'platillos' | 'restaurantes' | 'resenas') => Promise<string>;
    sugerirIA: (prompt: string, setter: (val: string) => void) => Promise<void>;
    guardando: boolean;
    mostrarMensaje: (tipo: 'exito' | 'error', texto: string) => void;
    onEstadoPublicacion?: (estado: EstadoPublicacion) => void;
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

/**
 * Campos que deben estar completos para publicar el sitio. El `grupo` es el
 * bloque del formulario: la barra de progreso de la cabecera agrupa con él los
 * datos que faltan, para que el resumen se lea como el propio formulario.
 */
const CAMPOS_OBLIGATORIOS: CampoPublicacion[] = [
    { k: 'nombre', l: 'Nombre', grupo: 'Información básica' },
    { k: 'eslogan', l: 'Eslogan', grupo: 'Información básica' },
    { k: 'descripcion', l: 'Descripción', grupo: 'Información básica' },
    { k: 'imagen_logo_url', l: 'Logo', grupo: 'Logo y banner' },
    { k: 'imagen_banner_url', l: 'Banner', grupo: 'Logo y banner' },
    { k: 'telefono', l: 'Teléfono', grupo: 'Ubicación y contacto' },
    { k: 'email', l: 'Email', grupo: 'Ubicación y contacto' },
    { k: 'direccion', l: 'Dirección', grupo: 'Ubicación y contacto' },
    { k: 'departamento', l: 'Departamento', grupo: 'Ubicación y contacto' },
    { k: 'municipio', l: 'Municipio', grupo: 'Ubicación y contacto' },
    { k: 'ciudad', l: 'Ciudad', grupo: 'Ubicación y contacto' },
    { k: 'whatsapp', l: 'WhatsApp', grupo: 'Ubicación y contacto' },
    { k: 'horario_apertura', l: 'Horario de apertura', grupo: 'Horarios' },
    { k: 'horario_cierre', l: 'Horario de cierre', grupo: 'Horarios' },
    { k: 'dias_abierto', l: 'Días de servicio', grupo: 'Horarios' },
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
/**
 * Teléfonos guardados por versiones anteriores traen «+57 300 000 0004».
 * El campo muestra el prefijo aparte y valida 10 dígitos, así que se normaliza
 * al entrar: sin esto, un dato legacy impedía guardar cualquier cambio.
 */
const soloDigitos10 = (valor?: string | null): string => {
    const digitos = String(valor ?? '').replace(/\D/g, '');
    return digitos.length > 10 ? digitos.slice(-10) : digitos;
};

const valoresIniciales = (restaurante: Restaurante): RestauranteFormValues => ({
    ...restaurante,
    nombre: restaurante.nombre ?? '',
    eslogan: restaurante.eslogan ?? '',
    descripcion: restaurante.descripcion ?? '',
    telefono: soloDigitos10(restaurante.telefono),
    email: restaurante.email ?? '',
    direccion: restaurante.direccion ?? '',
    departamento: restaurante.departamento ?? '',
    municipio: restaurante.municipio ?? '',
    ciudad: restaurante.ciudad ?? '',
    whatsapp: soloDigitos10(restaurante.whatsapp),
    facebook: restaurante.facebook ?? '',
    instagram: restaurante.instagram ?? '',
    horario_apertura: restaurante.horario_apertura ?? '',
    horario_cierre: restaurante.horario_cierre ?? '',
    imagen_logo_url: restaurante.imagen_logo_url ?? '',
    imagen_banner_url: restaurante.imagen_banner_url ?? '',
    dias_abierto: restaurante.dias_abierto ?? DIAS_VACIOS,
});

export const SeccionInfo: React.FC<SeccionInfoProps> = ({
    restaurante, guardarRestaurante, subirImagen, sugerirIA, guardando, mostrarMensaje,
    onEstadoPublicacion,
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
    const [arrastrando, setArrastrando] = useState<{ logo: boolean, banner: boolean }>({ logo: false, banner: false });
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

    // Las imágenes se suben al CDN y se enlazan al restaurante al instante:
    // si el dueño se va a otra pestaña, la recarga no las borra.
    const [logoUrl, setLogoUrl] = useState(restaurante.imagen_logo_url || '');
    const [bannerUrl, setBannerUrl] = useState(restaurante.imagen_banner_url || '');
    /* El disparador es un botón y el input vive oculto: un `<label>` envolviendo
       el file input se comportaba distinto en cada navegador móvil (y podía
       arrastrar el foco fuera del panel). */
    const inputLogoRef = useRef<HTMLInputElement>(null);
    const inputBannerRef = useRef<HTMLInputElement>(null);

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
    const clavesFaltantes = new Set(faltantes.map((f) => f.k));
    const listos = CAMPOS_OBLIGATORIOS.filter(c => !clavesFaltantes.has(c.k));
    const estaPublicado = faltantes.length === 0;
    const totalCampos = CAMPOS_OBLIGATORIOS.length;
    const completos = totalCampos - faltantes.length;
    const nombreActual = String(valoresForm?.nombre ?? '').trim();

    /** Fallos de formato que el usuario puede ver ahora mismo. */
    const erroresVisibles = mostrarErrores
        ? CAMPOS_OBLIGATORIOS
            .filter(c => Boolean((errors as any)[c.k]))
            .map(c => ({
                k: c.k,
                l: c.l,
                mensaje: String((errors as any)[c.k]?.message || 'Revisa este dato.'),
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

    /* --- Resumen en vivo ---------------------------------------------------
       El panel enseña el estado del sitio mientras se escribe: progreso,
       enlaces que ya funcionan y una miniatura de cómo lo verá el comensal.
       Todo sale del formulario, sin pedir nada más al servidor. */
    const formRef = useRef<HTMLFormElement>(null);
    const pct = totalCampos > 0 ? Math.round((completos / totalCampos) * 100) : 0;
    const diasActivos = DIAS_UI.filter((dia) => Boolean((valoresForm.dias_abierto as any)?.[dia.key]));
    const resumenDias =
        diasActivos.length === 7
            ? 'Todos los días'
            : diasActivos.length === 0
                ? 'Sin días aún'
                : diasActivos.map((dia) => dia.label).join(' · ');
    const resumenHorario =
        valoresForm.horario_apertura && valoresForm.horario_cierre
            ? `${valoresForm.horario_apertura} – ${valoresForm.horario_cierre}`
            : 'Horario por definir';
    const enlaceSitio = nombreActual
        ? urlPublica(`/restaurante/${generarSlugUnico(nombreActual, restaurante.id)}`)
        : '';
    const textoMapa = [valoresForm.direccion, valoresForm.municipio, valoresForm.departamento]
        .map((parte) => String(parte ?? '').trim())
        .filter(Boolean)
        .join(', ');
    const enlaceMapa = textoMapa
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textoMapa)}`
        : '';
    const numeroWhatsApp = String(valoresForm.whatsapp ?? '').replace(/\D/g, '');
    const enlaceWhatsApp =
        numeroWhatsApp.length === 10 ? `https://wa.me/57${numeroWhatsApp}` : '';
    const esloganValor = String(valoresForm.eslogan ?? '');
    const descripcionValor = String(valoresForm.descripcion ?? '');

    /** Ctrl/⌘ + S guarda sin soltar el teclado. */
    useEffect(() => {
        const alPulsar = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                formRef.current?.requestSubmit();
            }
        };
        window.addEventListener('keydown', alPulsar);
        return () => window.removeEventListener('keydown', alPulsar);
    }, []);

    /** Cerrar o recargar con cambios sin guardar pide confirmación. */
    useEffect(() => {
        if (!hayCambios) return;
        const aviso = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', aviso);
        return () => window.removeEventListener('beforeunload', aviso);
    }, [hayCambios]);


    const tieneError = (campo: string): boolean =>
        mostrarErrores && Boolean((errors as any)[campo]);

    const irA = useCallback((campo: string) => {
        setMostrarErrores(true);
        setCampoScroll(campo);
        setOrdenScroll(n => n + 1);
    }, []);

    /**
     * El estado de publicación se pinta en la cabecera junto al asistente de
     * IA. Se informa al panel solo cuando cambia el conjunto de pendientes, no
     * en cada tecla: si no, el `setState` del padre re-renderizaría el
     * formulario en un bucle.
     */
    const faltantesRef = useRef(faltantes);
    faltantesRef.current = faltantes;
    const listosRef = useRef(listos);
    listosRef.current = listos;
    const faltantesClave = faltantes.map((f) => f.k).join('|');

    useEffect(() => {
        onEstadoPublicacion?.({
            faltantes: faltantesRef.current,
            listos: listosRef.current,
            completos,
            total: totalCampos,
            estaPublicado,
            irA,
        });
    }, [faltantesClave, completos, totalCampos, estaPublicado, irA, onEstadoPublicacion]);

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
        // acaba de pulsar "Guardar cambios".
        const primero = CAMPOS_OBLIGATORIOS
            .map(c => c.k)
            .find(k => conError.includes(k))
            || conError[0]
            || 'nombre';
        irA(primero);
        const etiqueta = CAMPOS_OBLIGATORIOS.find(c => c.k === primero)?.l || 'el formulario';
        const detalle = (errores as any)[primero]?.message;
        const restantes = conError.length > 1
            ? ` Revisa ${conError.length - 1} ${conError.length - 1 === 1 ? 'campo más' : 'campos más'}.`
            : '';
        mostrarMensaje(
            'error',
            detalle
                ? `${etiqueta}: ${detalle}.${restantes}`
                : `${etiqueta}: revisa este dato.${restantes}`
        );
    };

    const handleFinalizar = async (data: RestauranteFormValues) => {
        /* Guardar no exige tener el 100 %: el dueño puede ir por partes y la
           tarjeta de publicación le dice qué falta. Antes un logo pendiente
           bloqueaba también el eslogan, la dirección o los horarios. Los
           formatos inválidos sí se bloquean antes, en `manejarInvalido`. */
        const datosCompletos = {
            ...data,
            // `direccion` y `ciudad` se componen con `setValue` y no tienen un
            // input registrado: en el submit pueden llegar vacíos aunque el
            // formulario los tenga. Se toman del estado actual.
            direccion: String(data.direccion ?? valoresForm.direccion ?? ''),
            ciudad: String(data.ciudad ?? valoresForm.ciudad ?? ''),
            imagen_logo_url: logoUrl,
            imagen_banner_url: bannerUrl,
        };
        const pendientes = CAMPOS_OBLIGATORIOS.filter(c => esFaltante(c.k, datosCompletos));
        try {
            await guardarRestaurante(datosCompletos as Partial<Restaurante>);
            await cocinaRef.current?.guardar();
            reset(valoresIniciales({ ...restaurante, ...datosCompletos } as Restaurante));
            setMostrarErrores(false);
            mostrarMensaje(
                'exito',
                pendientes.length === 0
                    ? 'Restaurante guardado. Tus cambios ya se ven en tu sitio.'
                    : pendientes.length === 1
                        ? 'Cambios guardados. Te falta 1 dato para publicar tu menú.'
                        : `Cambios guardados. Te faltan ${pendientes.length} datos para publicar tu menú.`
            );
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

    /**
     * Sube la imagen, la deja enlazada al restaurante al instante y actualiza
     * el estado local. Antes solo se guardaba al pulsar «Finalizar y guardar»:
     * si el dueño subía el logo y se iba al menú, la recarga de datos traía
     * `null` y las fotos desaparecían.
     */
    const subirArchivoImagen = async (file: File, tipo: 'logo' | 'banner') => {
        if (!file.type.startsWith('image/')) {
            mostrarMensaje('error', 'Elige una imagen: JPG, PNG o WebP.');
            return;
        }
        const anterior = tipo === 'logo' ? logoUrl : bannerUrl;
        setImgLoading(prev => ({ ...prev, [tipo]: true }));
        try {
            const url = await subirImagen(file, 'restaurantes');
            if (tipo === 'logo') setLogoUrl(url); else setBannerUrl(url);
            await guardarRestaurante({
                [tipo === 'logo' ? 'imagen_logo_url' : 'imagen_banner_url']: url,
            } as Partial<Restaurante>);
            mostrarMensaje('exito', tipo === 'logo' ? 'Logo actualizado.' : 'Banner actualizado.');
        } catch (error: any) {
            if (tipo === 'logo') setLogoUrl(anterior); else setBannerUrl(anterior);
            mostrarMensaje('error', error?.message || 'No se pudo subir la imagen.');
        } finally {
            setImgLoading(prev => ({ ...prev, [tipo]: false }));
        }
    };

    const wrapImagenUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'logo' | 'banner') => {
        const file = e.target.files?.[0];
        if (!file) return;
        await subirArchivoImagen(file, tipo);
        e.target.value = '';
    };

    const manejarDragOver = (e: React.DragEvent<HTMLDivElement>, tipo: 'logo' | 'banner') => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (!arrastrando[tipo]) setArrastrando(prev => ({ ...prev, [tipo]: true }));
    };

    const manejarDragLeave = (e: React.DragEvent<HTMLDivElement>, tipo: 'logo' | 'banner') => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setArrastrando(prev => ({ ...prev, [tipo]: false }));
    };

    const manejarDrop = async (e: React.DragEvent<HTMLDivElement>, tipo: 'logo' | 'banner') => {
        e.preventDefault();
        setArrastrando(prev => ({ ...prev, [tipo]: false }));
        const file = e.dataTransfer.files?.[0];
        if (file) await subirArchivoImagen(file, tipo);
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
                generarTextoIA(
                    `Crea un eslogan corto y memorable (máximo 6 palabras) para el restaurante "${nombre}". ` +
                    `${detalle} El eslogan debe evocar esa cocina concreta y no valer para cualquier negocio. ` +
                    'Devuelve solo el eslogan.',
                    SISTEMA_IA
                ),
                generarTextoIA(
                    `Escribe una descripción breve y apetitosa (máximo 280 caracteres) para el restaurante "${nombre}". ` +
                    `${detalle} Menciona el estilo de cocina y dos o tres platos o ingredientes típicos. ` +
                    'Tono cálido, en segunda persona, sin exageraciones. Devuelve solo la descripción.',
                    SISTEMA_IA
                ),
            ]);
            if (eslogan) setValue('eslogan', eslogan, { shouldDirty: true, shouldValidate: true });
            if (descripcion) setValue('descripcion', descripcion, { shouldDirty: true, shouldValidate: true });
            mostrarMensaje('exito', 'Texto generado. Revísalo y pulsa Guardar cambios.');
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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_312px] xl:grid-cols-[minmax(0,1fr)_336px]">
            <div className="min-w-0 space-y-5">

            {/* ---------- Errores de validación ---------- */}
            {erroresVisibles.length > 0 && (
                <section className="rounded-[20px] border border-af-danger/20 bg-af-danger/[0.07] p-4 md:p-5" role="alert">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 shrink-0 text-af-danger-text" size={19} aria-hidden="true" />
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold text-af-ink">Revisa estos campos</h3>
                            <p className="mt-1 text-xs leading-relaxed text-af-ink-secondary">
                                Toca uno para ir directo a corregirlo.
                            </p>
                            <ul className="mt-2 space-y-1 text-xs text-af-ink-secondary">
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

            {/* ---------- Progreso (móvil) ----------
                En escritorio el resumen vive en la columna derecha; en móvil se
                adelanta aquí para que el dueño sepa qué falta sin abrir nada. */}
            <div className="lg:hidden">
                <div className="flex items-center gap-4 rounded-[20px] border border-af/15 bg-af-surface p-4">
                    <AnilloProgreso
                        valor={pct}
                        tamano={58}
                        etiqueta={`${completos} de ${totalCampos} datos completos`}
                    />
                    <div className="min-w-0">
                        <p className="text-[13px] font-bold text-af-ink">
                            {completos} de {totalCampos} datos
                        </p>
                        <p className="mt-0.5 text-xs leading-snug text-af-ink-secondary">
                            {estaPublicado
                                ? 'Tu sitio está publicado. Puedes seguir ajustando lo que quieras.'
                                : faltantes.length === 1
                                    ? 'Te falta 1 dato para publicar tu menú.'
                                    : `Te faltan ${faltantes.length} datos para publicar tu menú.`}
                        </p>
                        {!estaPublicado && faltantes.length > 0 && (
                            <button
                                type="button"
                                onClick={() => irA(faltantes[0].k)}
                                className="mt-1.5 text-xs font-bold text-af-accent-text underline decoration-af-accent/30 underline-offset-4 hover:decoration-af-accent"
                            >
                                Completar ahora
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <form ref={formRef} onSubmit={handleSubmit(handleFinalizar, manejarInvalido)} noValidate className="space-y-5">

                {/* ---------- Nombre ---------- */}
                <TarjetaSeccion
                    id="info-identidad"
                    icono={<Store size={17} />}
                    titulo="Identidad"
                    descripcion="El nombre con el que te encuentran y el que encabeza tu menú."
                >
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
                </TarjetaSeccion>

                {/* ---------- Tipo de cocina (Descubrir) ----------
                    Va justo después del nombre: es el contexto con el que la IA
                    redacta el eslogan y la descripción. */}
                <TarjetaSeccion
                    icono={<UtensilsCrossed size={17} />}
                    titulo="Tipo de cocina"
                    descripcion="Con esto te encuentran en Descubrir y la IA escribe con tu acento."
                    desborde
                >
                    <SelectorCocina
                        ref={cocinaRef}
                        restauranteId={restaurante.id}
                        onCambios={setCocinasCambiadas}
                        onSeleccion={setCocinasElegidas}
                    />
                </TarjetaSeccion>

                {/* ---------- Eslogan y descripción ---------- */}
                <TarjetaSeccion
                    icono={<Wand2 size={17} />}
                    titulo="Eslogan y descripción"
                    descripcion="Dos frases que venden: la que se lee en la tarjeta y la que recibe al comensal."
                >
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

                    <div className="mt-5 space-y-6">
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
                                : <p className="ml-1 mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-af-ink-secondary">
                                    <span>Una frase corta que resume tu cocina{tipoCocina ? ` (${tipoCocina})` : ''}.</span>
                                    <span className="tabular-nums text-[11px] text-af-ink-secondary/70">{esloganValor.length}/{LIMITES.REST_ESLOGAN}</span>
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
                                : <p className="ml-1 mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-af-ink-secondary">
                                    <span>Se muestra en la cabecera de tu menú. La IA la escribe según tu tipo de cocina.</span>
                                    <span className="tabular-nums text-[11px] text-af-ink-secondary/70">{descripcionValor.length}/{LIMITES.REST_DESC}</span>
                                </p>}
                        </div>
                    </div>
                </TarjetaSeccion>

                {/* ---------- Imágenes ---------- */}
                <TarjetaSeccion
                    icono={<ImagePlus size={17} />}
                    titulo="Logo y banner"
                    descripcion="El logo te representa en la ficha y en el círculo de tu marca; el banner abre tu menú."
                >
                    <div className="grid items-stretch gap-4 md:grid-cols-2">
                        <div
                            onDragOver={(e) => manejarDragOver(e, 'logo')}
                            onDragLeave={(e) => manejarDragLeave(e, 'logo')}
                            onDrop={(e) => manejarDrop(e, 'logo')}
                            className={`flex flex-col rounded-2xl border-2 border-dashed p-4 text-center transition-colors md:h-full ${
                                arrastrando.logo
                                    ? 'border-af-accent bg-af-accent/10'
                                    : tieneError('imagen_logo_url')
                                        ? 'border-af-danger bg-af-danger/[0.06]'
                                        : 'border-af/25 bg-af-ground/50'
                            }`}
                        >
                            <div
                                id="campo-imagen_logo_url"
                                className="flex w-full flex-col items-center gap-3 md:h-full md:justify-between"
                            >
                                <span className="flex h-4 items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-af-ink-secondary">
                                    Logo <span className="text-af-danger">*</span>
                                </span>
                                <div className="relative flex h-32 w-full items-center justify-center">
                                    {logoUrl ? (
                                        <img
                                            src={logoUrl}
                                            className="h-28 w-28 rounded-full border border-af/15 object-cover shadow-sm"
                                            alt="Logo del restaurante"
                                        />
                                    ) : (
                                        <div className="flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-full border border-dashed border-af/30 bg-af-surface text-af-ink-secondary">
                                            <Upload size={20} aria-hidden="true" />
                                            <span className="text-[10px] font-medium">Sin logo</span>
                                        </div>
                                    )}
                                    {imgLoading.logo && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/35">
                                            <Loader2 size={26} className="animate-spin text-white" aria-hidden="true" />
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => inputLogoRef.current?.click()}
                                    className="btn-af h-10 w-full max-w-[11rem] justify-center px-4 text-xs"
                                >
                                    <Upload size={14} aria-hidden="true" /> {logoUrl ? 'Cambiar logo' : 'Subir logo'}
                                </button>
                                <input
                                    ref={inputLogoRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => wrapImagenUpload(e, 'logo')}
                                />
                                <span className="flex items-start justify-center text-[11px] leading-snug text-af-ink-secondary md:min-h-[2.25rem]">
                                    {arrastrando.logo ? 'Suelta la imagen aquí' : 'Arrastra una imagen o elige un archivo · JPG, PNG o WebP'}
                                </span>
                                <span className="flex items-center justify-center text-xs font-medium text-af-danger-text md:min-h-[1rem]">
                                    {tieneError('imagen_logo_url') ? 'El logo es obligatorio.' : ''}
                                </span>
                            </div>
                        </div>

                        <div
                            onDragOver={(e) => manejarDragOver(e, 'banner')}
                            onDragLeave={(e) => manejarDragLeave(e, 'banner')}
                            onDrop={(e) => manejarDrop(e, 'banner')}
                            className={`flex flex-col rounded-2xl border-2 border-dashed p-4 text-center transition-colors md:h-full ${
                                arrastrando.banner
                                    ? 'border-af-accent bg-af-accent/10'
                                    : tieneError('imagen_banner_url')
                                        ? 'border-af-danger bg-af-danger/[0.06]'
                                        : 'border-af/25 bg-af-ground/50'
                            }`}
                        >
                            <div
                                id="campo-imagen_banner_url"
                                className="flex w-full flex-col items-center gap-3 md:h-full md:justify-between"
                            >
                                <span className="flex h-4 items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-af-ink-secondary">
                                    Banner <span className="text-af-danger">*</span>
                                </span>
                                <div className="relative flex h-32 w-full items-center justify-center">
                                    {bannerUrl ? (
                                        <img
                                            src={bannerUrl}
                                            className="h-32 w-full rounded-xl border border-af/15 object-cover shadow-sm"
                                            alt="Banner del restaurante"
                                        />
                                    ) : (
                                        <div className="flex h-32 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-af/30 bg-af-surface text-af-ink-secondary">
                                            <Upload size={20} aria-hidden="true" />
                                            <span className="text-[10px] font-medium">Sin banner</span>
                                        </div>
                                    )}
                                    {imgLoading.banner && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/35">
                                            <Loader2 size={26} className="animate-spin text-white" aria-hidden="true" />
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => inputBannerRef.current?.click()}
                                    className="btn-af h-10 w-full max-w-[11rem] justify-center px-4 text-xs"
                                >
                                    <Upload size={14} aria-hidden="true" /> {bannerUrl ? 'Cambiar banner' : 'Subir banner'}
                                </button>
                                <input
                                    ref={inputBannerRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => wrapImagenUpload(e, 'banner')}
                                />
                                <span className="flex items-start justify-center text-[11px] leading-snug text-af-ink-secondary md:min-h-[2.25rem]">
                                    {arrastrando.banner ? 'Suelta la imagen aquí' : 'Horizontal, mínimo 1200 px de ancho · JPG, PNG o WebP'}
                                </span>
                                <span className="flex items-center justify-center text-xs font-medium text-af-danger-text md:min-h-[1rem]">
                                    {tieneError('imagen_banner_url') ? 'El banner es obligatorio.' : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                </TarjetaSeccion>

                {/* ---------- Ubicación y contacto ---------- */}
                <TarjetaSeccion
                    icono={<MapPin size={17} />}
                    titulo="Ubicación y contacto"
                    descripcion="Así te encuentran y te escriben. El WhatsApp abre el pedido del comensal."
                >
                    <div className="space-y-6">
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
                            {enlaceMapa && !tieneError('direccion') && (
                                <a
                                    href={enlaceMapa}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ml-1 mt-2 inline-flex items-center gap-1 text-xs font-semibold text-af-accent-text underline decoration-af-accent/30 underline-offset-4 hover:decoration-af-accent"
                                >
                                    <MapPin size={13} aria-hidden="true" /> Ver la dirección en el mapa
                                    <ExternalLink size={12} aria-hidden="true" />
                                </a>
                            )}
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
                                {!tieneError('whatsapp') && enlaceWhatsApp && (
                                    <a
                                        href={enlaceWhatsApp}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="ml-1 mt-2 inline-flex items-center gap-1 text-xs font-semibold text-af-success underline decoration-af-success/30 underline-offset-4 hover:decoration-af-success"
                                    >
                                        <LogoWhatsApp className="h-3.5 w-3.5" /> Probar el enlace de WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </TarjetaSeccion>

                {/* ---------- Horarios ---------- */}
                <TarjetaSeccion
                    icono={<Clock size={17} />}
                    titulo="Horarios"
                    descripcion="Cuándo abres y qué días. Se muestra en tu ficha y en el menú."
                    acciones={<Chip tono="marca">{resumenHorario}</Chip>}
                >
                    <div className="space-y-6">
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
                            {!tieneError('dias_abierto') && diasActivos.length > 0 && (
                                <p className="ml-1 mt-2 text-xs text-af-ink-secondary">
                                    Abres {resumenDias.toLowerCase()} · {resumenHorario}
                                </p>
                            )}
                        </div>
                    </div>
                </TarjetaSeccion>

                {/* ---------- Finalizar ----------
                    La misma banda que el editor de platillos: pegada abajo y
                    difuminada, para que guardar esté siempre a la vista sin
                    tapar el formulario. Sin relleno inferior en los ancestros
                    se ancla al borde mismo de la pantalla al llegar al final. */}
                <div className="sticky bottom-2 z-20 mt-2 flex flex-wrap items-center gap-2 rounded-2xl border border-af/15 bg-af-surface/95 px-2.5 py-2 shadow-[0_18px_44px_-18px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:flex-nowrap sm:px-3">
                    <p className="hidden items-center gap-2 text-xs text-af-ink-secondary sm:flex">
                        {hayCambios ? (
                            <>
                                <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                                Tienes cambios sin guardar
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={15} className="shrink-0 text-af-success" aria-hidden="true" />
                                Todo guardado
                            </>
                        )}
                        <span className="ml-2 hidden items-center gap-1 text-[10px] text-af-ink-secondary/60 md:flex" aria-hidden="true">
                            <kbd className="rounded border border-af/20 bg-af-surface px-1.5 py-0.5 font-sans text-[10px] leading-none">Ctrl</kbd>
                            <span>+</span>
                            <kbd className="rounded border border-af/20 bg-af-surface px-1.5 py-0.5 font-sans text-[10px] leading-none">S</kbd>
                        </span>
                    </p>
                    <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
                        <BotonTexto
                            onClick={descartarCambios}
                            disabled={!hayCambios || guardando}
                            className="flex-1 justify-center whitespace-nowrap sm:flex-none"
                        >
                            <RotateCcw size={14} aria-hidden="true" /> Descartar
                        </BotonTexto>
                        <BotonCTA
                            type="submit"
                            cargando={guardando}
                            disabled={guardando || !hayCambios}
                            iconoDerecho={hayCambios ? <Save size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
                            className="flex-[1.35] justify-center whitespace-nowrap !text-[13px] sm:flex-none sm:!text-[14px]"
                            title="Guardar los cambios (Ctrl+S)"
                        >
                            {hayCambios ? 'Guardar cambios' : 'Todo guardado'}
                        </BotonCTA>
                    </div>
                </div>
            </form>
            </div>

            {/* Resumen en vivo: estado de publicación y miniatura de la ficha. */}
            <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-4">
                    <div className="card-af border border-af/10 !p-5">
                        <div className="flex items-center gap-3">
                            <AnilloProgreso
                                valor={pct}
                                tamano={64}
                                etiqueta={`${pct}% de los datos completos`}
                            />
                            <div className="min-w-0">
                                <p className="text-[13px] font-bold leading-tight text-af-ink">
                                    {estaPublicado
                                        ? 'Sitio publicado'
                                        : faltantes.length === 1
                                            ? '1 dato por completar'
                                            : `${faltantes.length} datos por completar`}
                                </p>
                                <p className="mt-1 text-[11.5px] leading-snug text-af-ink-secondary">
                                    {completos} de {totalCampos} obligatorios listos
                                </p>
                            </div>
                        </div>

                        {estaPublicado ? (
                            <a
                                href={enlaceSitio}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-af-success/10 px-3 py-2.5 text-xs font-bold text-af-success transition-colors hover:bg-af-success/15"
                            >
                                Ver mi sitio <ExternalLink size={13} aria-hidden="true" />
                            </a>
                        ) : (
                            <ul className="mt-4 space-y-0.5 border-t border-af/10 pt-3">
                                {faltantes.slice(0, 7).map((campo) => (
                                    <li key={campo.k}>
                                        <button
                                            type="button"
                                            onClick={() => irA(campo.k)}
                                            className="group flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left outline-none transition-colors hover:bg-af-accent/[0.07] focus-visible:bg-af-accent/[0.07]"
                                        >
                                            <CircleDashed size={13} className="shrink-0 text-af-danger-text" aria-hidden="true" />
                                            <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-af-ink">
                                                {campo.l}
                                            </span>
                                            <ChevronRight
                                                size={13}
                                                className="shrink-0 text-af-ink-secondary/60 transition-transform group-hover:translate-x-0.5"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </li>
                                ))}
                                {faltantes.length > 7 && (
                                    <li className="px-1.5 pt-1 text-[11px] text-af-ink-secondary">
                                        y {faltantes.length - 7} más…
                                    </li>
                                )}
                            </ul>
                        )}

                        <p className="mt-3 border-t border-af/10 pt-3 text-[10.5px] leading-relaxed text-af-ink-secondary/80">
                            Los campos con <span className="text-af-danger">*</span> son obligatorios para publicar tu sitio.
                        </p>
                    </div>

                    <div className="card-af overflow-hidden border border-af/10 !p-0">
                        <div className="relative h-24 bg-af-accent/10">
                            {bannerUrl ? (
                                <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.16em] text-af-ink-secondary/60">
                                    Tu banner
                                </div>
                            )}
                            <span className="absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                                Vista previa
                            </span>
                        </div>
                        <div className="relative px-4 pb-4 pt-9">
                            <div className="absolute -top-7 left-4 h-14 w-14 overflow-hidden rounded-full border-4 border-af-surface bg-af-surface shadow-sm">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-af-accent/10 text-af-accent-text">
                                        <Store size={20} aria-hidden="true" />
                                    </div>
                                )}
                            </div>
                            <p className="truncate text-[15px] font-bold text-af-ink">
                                {nombreActual || 'Tu restaurante'}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-af-ink-secondary">
                                {esloganValor || 'Tu eslogan aparecerá aquí.'}
                            </p>
                            <div className="mt-3 space-y-1.5 border-t border-af/10 pt-3">
                                <FilaDato icono={<MapPin size={13} aria-hidden="true" />}>
                                    {[valoresForm.municipio, valoresForm.departamento].filter(Boolean).join(', ') || 'Ciudad por definir'}
                                </FilaDato>
                                <FilaDato icono={<Clock size={13} aria-hidden="true" />}>
                                    {resumenHorario}
                                </FilaDato>
                                <FilaDato icono={<CalendarDays size={13} aria-hidden="true" />}>
                                    {resumenDias}
                                </FilaDato>
                            </div>
                            {enlaceSitio && (
                                <a
                                    href={enlaceSitio}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 flex items-center justify-between rounded-xl border border-af/15 px-3 py-2 text-[11px] font-bold text-af-ink-secondary transition-colors hover:border-af-accent/40 hover:text-af-accent-text"
                                >
                                    Ver la ficha pública <ExternalLink size={13} aria-hidden="true" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
};
