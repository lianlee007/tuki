/**
 * Descripción: Crear y editar un plato del menú.
 *
 * Un solo hilo de campos, en el orden en que se piensa un plato (qué es, cómo
 * se describe, cuánto cuesta, cómo se ve y si está disponible), el asistente
 * de IA siempre a la vista y la barra de guardado pegada abajo para no tener
 * que buscarla al final de un formulario largo.
 */
import React, { useState, useEffect, useId, Dispatch, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Platillo } from '../../tipos';
import {
  PlatilloSchema, PlatilloFormValues,
  RE_PLATILLO_NOMBRE_TIPEO, RE_PLATILLO_DESC_TIPEO, RE_INGREDIENTES_TIPEO,
  entradaPermitida, limpiarNombre, limpiarDescripcion, limpiarIngrediente,
} from '../../tipos/esquemas';
import { Boton, BotonTexto, Input, Textarea } from '../ui';
import { ImagenInteligente } from '../sistema-diseno/ImagenInteligente';
import {
  Wand2, DollarSign, Upload, EyeOff, Power, Ban, SpellCheck, Loader2,
  Undo2,
} from 'lucide-react';
import { LIMITES } from '../../constantes';
import { prefiereMenosMovimiento } from '../../lib/utils';
import { EstadoPlatillo, ESTADOS, estadoDe, camposDeEstado, definicionEstado } from '../../modulos/menu';
import { AsistenteIA, BotonIA } from './AsistenteIA';

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

/**
 * Categorías sugeridas al crear o editar un plato.
 *
 * Van agrupadas por tema para poder revisarlas de un vistazo, pero el
 * `<datalist>` las recibe ordenadas alfabéticamente, que es como se buscan al
 * escribir. La lista es sólo una sugerencia: el campo acepta cualquier texto,
 * así que un restaurante con una carta muy suya nunca queda fuera.
 */
const CATEGORIAS_SUGERIDAS: Record<string, string[]> = {
  /* Cómo se come y a qué hora */
  momentos: [
    'Desayunos', 'Almuerzos', 'Cenas', 'Meriendas', 'Entradas', 'Platos fuertes',
    'Para compartir', 'Pasabocas', 'Menú del día', 'Menú infantil', 'Ejecutivo',
    'A la carta', 'Buffet', 'Combos', 'Promociones',
  ],
  /* Cocinas del mundo */
  cocinas: [
    'Alemana', 'Americana', 'Árabe', 'Argentina', 'Asiática', 'Brasileña',
    'Caribeña', 'Chilena', 'China', 'Colombiana', 'Coreana', 'Cubana',
    'Dominicana', 'Ecuatoriana', 'Española', 'Francesa', 'Fusión', 'Griega',
    'Hindú', 'India', 'Israelí', 'Italiana', 'Japonesa', 'Libanesa',
    'Mediterránea', 'Mexicana', 'Panameña', 'Peruana', 'Puertorriqueña',
    'Tailandesa', 'Tex-Mex', 'Turca', 'Uruguaya', 'Venezolana', 'Vietnamita',
  ],
  /* Tipos de plato */
  platos: [
    'Acompañantes', 'Adiciones', 'Alitas', 'Antojitos', 'Arepas', 'Arroces',
    'Asados', 'Burritos', 'Caldos', 'Calzone', 'Carnes', 'Ceviche',
    'Charcutería', 'Churrasco', 'Costillas', 'Cremas', 'Empanadas', 'Ensaladas',
    'Fajitas', 'Fritos', 'Guarniciones', 'Hamburguesas', 'Lasagna', 'Mariscos',
    'Milanesas', 'Nachos', 'Paella', 'Parrilla', 'Pastas', 'Perros calientes',
    'Pescados', 'Pizza', 'Pokes', 'Pollo', 'Quesadillas', 'Ramen', 'Raviolis',
    'Risotto', 'Salsas', 'Sándwiches', 'Sopas', 'Sushi', 'Tabla de quesos',
    'Tacos', 'Tamales', 'Típicos', 'Wok', 'Wraps',
  ],
  /* Dulce y panadería */
  dulce: [
    'Chocolates', 'Crepes', 'Donuts', 'Dulces típicos', 'Galletas', 'Helados',
    'Panadería', 'Pastelería', 'Postres', 'Repostería', 'Tortas', 'Waffles',
  ],
  /* Bebidas */
  bebidas: [
    'Agua', 'Batidos', 'Bebidas', 'Bebidas calientes', 'Bebidas frías', 'Café',
    'Café de especialidad', 'Cerveza artesanal', 'Cervezas', 'Cócteles',
    'Gaseosas', 'Infusiones', 'Jugos naturales', 'Licores', 'Limonadas',
    'Micheladas', 'Smoothies', 'Té', 'Vinos',
  ],
  /* Estilos y dietas */
  dietas: [
    'Alto en proteína', 'Artesanal', 'Bajo en calorías', 'Casero', 'Fitness',
    'Gourmet', 'Keto', 'Light', 'Orgánico', 'Saludable', 'Sin azúcar',
    'Sin gluten', 'Sin lactosa', 'Vegano', 'Vegetariano',
  ],
  /* Qué ofrece el local más allá del plato */
  formatos: [
    'Brunch', 'Catering', 'Comida rápida', 'Del chef', 'De temporada',
    'Especialidades de la casa', 'Fritanga', 'Marisquería', 'Navideño',
    'Pizzería', 'Sushi bar',
  ],
};

const CATEGORIAS_ESTANDAR = Object.values(CATEGORIAS_SUGERIDAS)
  .flat()
  .sort((a, b) => a.localeCompare(b, 'es'));

/* ------------------------------------------------------------------ *
 *  Piezas de formulario
 * ------------------------------------------------------------------ */

/** Etiqueta, acción de IA opcional, campo, y una línea de error o ayuda. */
const Campo: React.FC<{
  etiqueta: string;
  htmlFor?: string;
  requerido?: boolean;
  accion?: React.ReactNode;
  error?: string;
  contador?: { actual: number; max: number };
  ayuda?: string;
  children: React.ReactNode;
}> = ({ etiqueta, htmlFor, requerido, accion, error, contador, ayuda, children }) => (
  <div>
    <div className="mb-2 flex min-h-[28px] items-center justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-medium text-af-ink">
        {etiqueta}
        {requerido && <span className="ml-0.5 text-af-danger" aria-hidden>*</span>}
      </label>
      {accion}
    </div>
    {children}
    {(error || ayuda || contador) && (
      <div className="mt-1.5 flex items-start justify-between gap-3 text-xs">
        <p className={error ? 'font-medium text-af-danger-text' : 'text-af-ink-secondary'}>{error || ayuda || ''}</p>
        {contador && (
          <span className="shrink-0 tabular-nums text-af-ink-secondary">
            {contador.actual}/{contador.max}
          </span>
        )}
      </div>
    )}
  </div>
);

/** Interruptor de sí/no. Sólo mueve `transform` y `background-color`. */
const Interruptor: React.FC<{
  id: string;
  activo: boolean;
  onChange: (v: boolean) => void;
  etiqueta: string;
  descripcion: string;
}> = ({ id, activo, onChange, etiqueta, descripcion }) => (
  <button
    type="button"
    id={id}
    role="switch"
    aria-checked={activo}
    onClick={() => onChange(!activo)}
    className="flex w-full items-center justify-between gap-4 rounded-2xl bg-af-ground px-4 py-3 text-left transition-colors duration-150 outline-none hover:bg-af-ink/[0.04]"
  >
    <span className="min-w-0">
      <span className="block text-sm font-medium text-af-ink">{etiqueta}</span>
      <span className="mt-0.5 block text-xs leading-snug text-af-ink-secondary">{descripcion}</span>
    </span>
    <span
      className={`relative block h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
        activo ? 'bg-af-success' : 'bg-af-ink/20'
      }`}
      aria-hidden
    >
      <span
        className={`absolute left-0.5 top-0.5 block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
          activo ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </span>
  </button>
);

/* ------------------------------------------------------------------ *
 *  Editor
 * ------------------------------------------------------------------ */

export const EditorPlatillo: React.FC<EditorPlatilloProps> = ({
  platillo, guardar, cancelar, sugerirIA, handleImagenUpload, guardando, restauranteNombre,
}) => {
  const id = useId();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PlatilloFormValues>({
    resolver: zodResolver(PlatilloSchema),
    // Los avisos aparecen al salir del campo, no mientras se escribe.
    mode: 'onTouched',
    defaultValues: {
      nombre: platillo.nombre || '',
      descripcion: platillo.descripcion || '',
      precio: platillo.precio || 0,
      categoria: platillo.categoria || '',
      imagen_url: platillo.imagen_url || '',
      ingredientes: platillo.ingredientes || [],
      visible: platillo.visible !== false,
      disponible: platillo.disponible !== false,
      destacado: platillo.destacado || false,
    },
  });

  const valores = watch();
  const nombre = (valores.nombre || '').trim();
  const estado = estadoDe({ disponible: !!valores.disponible, visible: !!valores.visible });

  const [ingredientesTemp, setIngredientesTemp] = useState(platillo.ingredientes?.join(', ') || '');
  const [precioDisplay, setPrecioDisplay] = useState(platillo.precio ? platillo.precio.toLocaleString('es-CO') : '');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  // El resumen del pie sólo tiene sentido después de intentar guardar; si no,
  // aparecería al salir de un solo campo.
  const [intentoEnvio, setIntentoEnvio] = useState(false);
  const [deshacerIA, setDeshacerIA] = useState<{ descripcion: string; ingredientes: string; categoria: string } | null>(null);

  const ocupado = loadingAction !== null || guardando;
  const puedeGenerar = nombre.length >= 3 && !ocupado;
  const haySenalesParaCategoria = nombre.length > 2 || (valores.descripcion || '').length > 5 || ingredientesTemp.length > 0;

  const ingredientes = (valores.ingredientes ?? []).filter(Boolean);

  useEffect(() => {
    if (platillo.imagen_url) setValue('imagen_url', platillo.imagen_url);
  }, [platillo.imagen_url, setValue]);

  /* ---------------- Campos ---------------- */

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (entradaPermitida(e.target.value, valores.nombre ?? '', RE_PLATILLO_NOMBRE_TIPEO)) {
      setValue('nombre', e.target.value);
    }
  };

  const handleDescripcionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (entradaPermitida(e.target.value, valores.descripcion ?? '', RE_PLATILLO_DESC_TIPEO)) {
      setValue('descripcion', e.target.value);
    }
  };

  /** El textarea manda: el texto se refleja en el formulario a cada tecla. */
  const escribirIngredientes = (val: string) => {
    setIngredientesTemp(val);
    setValue('ingredientes', val.split(',').map((i) => i.trim()).filter(Boolean));
  };

  const handleIngredientesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (entradaPermitida(e.target.value, ingredientesTemp, RE_INGREDIENTES_TIPEO)) {
      escribirIngredientes(e.target.value);
    }
  };

  const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const soloDigitos = e.target.value.replace(/\D/g, '').slice(0, 7);
    if (soloDigitos === '') {
      setPrecioDisplay('');
      setValue('precio', 0);
      return;
    }
    const numero = parseInt(soloDigitos, 10);
    setPrecioDisplay(numero.toLocaleString('es-CO'));
    setValue('precio', numero);
  };

  const aplicarEstado = (nuevo: EstadoPlatillo) => {
    const campos = camposDeEstado(nuevo, { disponible: !!valores.disponible });
    setValue('visible', campos.visible);
    setValue('disponible', campos.disponible);
  };

  const onImageWrapperChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    if (!input.files?.length) return;
    setLoadingImage(true);
    try {
      await handleImagenUpload(e);
    } finally {
      setLoadingImage(false);
      // Permite volver a elegir el mismo archivo si el primero falló.
      input.value = '';
    }
  };

  /* ---------------- Guardar ---------------- */

  const onSubmit = (data: PlatilloFormValues) => {
    const limpios = ingredientesTemp
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean)
      .map((i) => i.charAt(0).toUpperCase() + i.slice(1));
    guardar({ ...platillo, ...data, ingredientes: limpios, categoria: (data.categoria || '').trim() });
  };

  /** Lleva la vista al primer campo con error, en vez de dejarlo fuera de pantalla. */
  const alFallar = (errores: FieldErrors<PlatilloFormValues>) => {
    setIntentoEnvio(true);
    const conError = Object.keys(errores);
    if (!conError.length) return;
    // El de más arriba en el formulario, no el primero del objeto de errores:
    // el orden del objeto depende del validador y no coincide con lo que se ve.
    const nodo = [...document.querySelectorAll<HTMLElement>('[data-campo]')]
      .find((n) => conError.includes(n.dataset.campo || ''));
    if (!nodo) return;
    nodo.scrollIntoView({ behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth', block: 'center' });
    nodo.focus({ preventScroll: true });
  };

  /* ---------------- IA ---------------- */

  const runIA = async (accion: string, logica: () => Promise<void>) => {
    setLoadingAction(accion);
    try {
      await logica();
    } finally {
      setLoadingAction(null);
    }
  };

  const iaOrtografia = () => runIA('ortografia', () => sugerirIA(
    `Corrige la ortografía de este nombre de plato de "${restauranteNombre}": "${watch('nombre')}". Devuelve solo el nombre corregido, sin comillas.`,
    (val) => setValue('nombre', limpiarNombre(val, LIMITES.PLATILLO_NOMBRE), { shouldValidate: true }),
  ));

  const iaDesc = () => runIA('descripcion', () => sugerirIA(
    `Escribe una descripción breve, apetitosa y comercial (máximo ${LIMITES.PLATILLO_DESC} caracteres) para el plato "${nombre}". Devuelve solo la descripción.`,
    (val) => setValue('descripcion', limpiarDescripcion(val, LIMITES.PLATILLO_DESC), { shouldValidate: true }),
  ));

  const iaIng = () => runIA('ingredientes', () => sugerirIA(
    `Lista los 5 ingredientes principales del plato "${nombre}", separados por comas. Devuelve solo la lista.`,
    (val) => escribirIngredientes(val.split(',').map((i) => limpiarIngrediente(i, 40)).filter(Boolean).join(', ')),
  ));

  /** Encaja la respuesta de la IA en la lista de categorías o la respeta si es nueva. */
  const aplicarCategoria = (val: string) => {
    const limpio = val.replace(/^["']|["']$/g, '').replace(/\.$/, '').trim();
    if (!limpio) return;
    const minuscula = limpio.toLowerCase();
    const exacta = CATEGORIAS_ESTANDAR.find((cat) => cat.toLowerCase() === minuscula);
    const parecida = exacta ?? CATEGORIAS_ESTANDAR.find(
      (cat) => cat.toLowerCase().includes(minuscula) || minuscula.includes(cat.toLowerCase()),
    );
    setValue('categoria', (parecida ?? limpio).slice(0, LIMITES.PLATILLO_CAT), { shouldValidate: true });
  };

  const iaCategoria = () => runIA('categoria', () => sugerirIA(
    `Clasifica el plato "${nombre}" del restaurante "${restauranteNombre}" en UNA de estas categorías: ${CATEGORIAS_ESTANDAR.join(', ')}. Responde solo con la categoría.`,
    aplicarCategoria,
  ));

  /** Rellena descripción, ingredientes y categoría de una vez. Se puede deshacer. */
  const autocompletarConIA = () => runIA('auto', async () => {
    if (nombre.length < 3) return;
    setDeshacerIA({
      descripcion: valores.descripcion ?? '',
      ingredientes: ingredientesTemp,
      categoria: valores.categoria ?? '',
    });

    await sugerirIA(
      `Escribe una descripción breve, apetitosa y comercial (máximo ${LIMITES.PLATILLO_DESC} caracteres) para el plato "${nombre}" del restaurante "${restauranteNombre}". Devuelve solo la descripción.`,
      (val) => setValue('descripcion', limpiarDescripcion(val, LIMITES.PLATILLO_DESC), { shouldValidate: true }),
    );
    await sugerirIA(
      `Lista los 5 ingredientes principales del plato "${nombre}", separados por comas. Devuelve solo la lista.`,
      (val) => escribirIngredientes(val.split(',').map((i) => limpiarIngrediente(i, 40)).filter(Boolean).join(', ')),
    );
    await sugerirIA(
      `Clasifica el plato "${nombre}" del restaurante "${restauranteNombre}" en UNA de estas categorías: ${CATEGORIAS_ESTANDAR.join(', ')}. Responde solo con la categoría.`,
      aplicarCategoria,
    );
  });

  const deshacerAutocompletado = () => {
    if (!deshacerIA) return;
    setValue('descripcion', deshacerIA.descripcion);
    escribirIngredientes(deshacerIA.ingredientes);
    setValue('categoria', deshacerIA.categoria);
    setDeshacerIA(null);
  };

  /* ---------------- Render ---------------- */

  return (
    <form onSubmit={handleSubmit(onSubmit, alFallar)} className="mx-auto max-w-3xl" noValidate>

      {/* Asistente de IA */}
      <AsistenteIA
        titulo="Asistente de IA"
        descripcion="Escribe el nombre y la IA redacta la descripción, los ingredientes y la categoría. Después corriges lo que quieras."
        principal={{
          etiqueta: loadingAction === 'auto' ? 'Generando…' : 'Completar el plato',
          onClick: autocompletarConIA,
          cargando: loadingAction === 'auto',
          disabled: !puedeGenerar,
        }}
        extra={deshacerIA && (
          <BotonTexto onClick={deshacerAutocompletado} disabled={ocupado}>
            <Undo2 size={16} /> Deshacer
          </BotonTexto>
        )}
        nota={nombre.length < 3 ? 'Escribe al menos 3 letras en «Nombre del plato» para activarlo.' : undefined}
      />

      {/* El plato */}
      <section className="mt-8 space-y-6 rounded-3xl bg-af-surface p-5 sm:p-6">
        <h2 className="text-base font-bold text-af-ink">El plato</h2>

        <Campo
          etiqueta="Nombre del plato"
          htmlFor={`${id}-nombre`}
          requerido
          error={errors.nombre?.message}
          contador={{ actual: (valores.nombre ?? '').length, max: LIMITES.PLATILLO_NOMBRE }}
          accion={nombre.length > 2 ? (
            <BotonIA onClick={iaOrtografia} cargando={loadingAction === 'ortografia'} disabled={ocupado} icono={<SpellCheck size={13} />}>
              Corregir
            </BotonIA>
          ) : undefined}
        >
          <Input
            id={`${id}-nombre`}
            data-campo="nombre"
            {...register('nombre')}
            value={valores.nombre ?? ''}
            onChange={handleNombreChange}
            placeholder="Ej: Hamburguesa clásica"
            maxLength={LIMITES.PLATILLO_NOMBRE}
            autoComplete="off"
            error={!!errors.nombre}
          />
        </Campo>

        <Campo
          etiqueta="Descripción"
          htmlFor={`${id}-descripcion`}
          requerido
          error={errors.descripcion?.message}
          contador={{ actual: (valores.descripcion ?? '').length, max: LIMITES.PLATILLO_DESC }}
          accion={(
            <BotonIA onClick={iaDesc} cargando={loadingAction === 'descripcion'} disabled={ocupado || nombre.length < 3} icono={<Wand2 size={13} />}>
              Escribir
            </BotonIA>
          )}
        >
          <Textarea
            id={`${id}-descripcion`}
            data-campo="descripcion"
            {...register('descripcion')}
            value={valores.descripcion ?? ''}
            onChange={handleDescripcionChange}
            maxLength={LIMITES.PLATILLO_DESC}
            placeholder="Ej: Carne a la parrilla con queso fundido y pan artesanal."
            error={!!errors.descripcion}
          />
        </Campo>

        <Campo
          etiqueta="Ingredientes"
          htmlFor={`${id}-ingredientes`}
          requerido
          error={errors.ingredientes?.message}
          ayuda="Sepáralos con comas."
          accion={(
            <BotonIA onClick={iaIng} cargando={loadingAction === 'ingredientes'} disabled={ocupado || nombre.length < 3} icono={<Wand2 size={13} />}>
              Sugerir
            </BotonIA>
          )}
        >
          <Textarea
            id={`${id}-ingredientes`}
            data-campo="ingredientes"
            {...register('ingredientes')}
            value={ingredientesTemp}
            onChange={handleIngredientesChange}
            placeholder="Pan artesanal, carne 100% de res, queso cheddar, tomate"
            maxLength={LIMITES.INGREDIENTES}
            className="min-h-[88px]"
            error={!!errors.ingredientes}
          />
          {ingredientes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ingredientes.map((ing, i) => (
                <span key={`${ing}-${i}`} className="af-etiqueta text-af-ink">{ing}</span>
              ))}
            </div>
          )}
        </Campo>

        <Campo
          etiqueta="Categoría"
          htmlFor={`${id}-categoria`}
          requerido
          error={errors.categoria?.message}
          ayuda="Dónde aparece en la carta. También puedes escribir una nueva."
          accion={haySenalesParaCategoria ? (
            <BotonIA onClick={iaCategoria} cargando={loadingAction === 'categoria'} disabled={ocupado} icono={<Wand2 size={13} />}>
              Deducir
            </BotonIA>
          ) : undefined}
        >
          <input
            id={`${id}-categoria`}
            data-campo="categoria"
            list={`${id}-categorias`}
            maxLength={LIMITES.PLATILLO_CAT}
            autoComplete="off"
            placeholder="Selecciona o escribe…"
            {...register('categoria')}
            className={`input-af h-11 text-sm ${errors.categoria ? 'border-af-danger focus:border-af-danger' : ''}`}
          />
          <datalist id={`${id}-categorias`}>
            {CATEGORIAS_ESTANDAR.map((cat) => <option key={cat} value={cat} />)}
          </datalist>
        </Campo>
      </section>

      {/* Precio y foto */}
      <section className="mt-8 space-y-6 rounded-3xl bg-af-surface p-5 sm:p-6">
        <h2 className="text-base font-bold text-af-ink">Precio y foto</h2>

        <Campo
          etiqueta="Precio"
          htmlFor={`${id}-precio`}
          requerido
          error={errors.precio?.message}
          ayuda="Entre $1.000 y $200.000."
        >
          <Input
            id={`${id}-precio`}
            data-campo="precio"
            {...register('precio')}
            type="text"
            inputMode="numeric"
            value={precioDisplay}
            onChange={handlePrecioChange}
            icon={<DollarSign size={16} />}
            placeholder="0"
            autoComplete="off"
            error={!!errors.precio}
            className="font-semibold tabular-nums"
          />
        </Campo>

        <Campo
          etiqueta="Foto del plato"
          requerido
          error={errors.imagen_url?.message}
          ayuda="Es lo primero que ve el cliente. Cuadrada, con buena luz."
        >
          <div className={`flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center ${
            errors.imagen_url ? 'bg-af-danger/5 ring-1 ring-af-danger/40' : 'bg-af-ground'
          }`}>
            <div className="h-36 w-full shrink-0 overflow-hidden rounded-2xl sm:h-28 sm:w-28">
              {valores.imagen_url ? (
                <ImagenInteligente src={valores.imagen_url} alt="" className="h-full w-full" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-af-surface text-af-ink-secondary">
                  <EyeOff size={22} />
                  <span className="text-[11px]">Sin foto</span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <label
                className={`btn-af h-11 cursor-pointer px-5 text-sm ${
                  loadingImage ? 'pointer-events-none opacity-60' : ''
                }`}
              >
                {loadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {loadingImage ? 'Subiendo…' : valores.imagen_url ? 'Cambiar la foto' : 'Subir una foto'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={onImageWrapperChange}
                  disabled={loadingImage}
                />
              </label>
              <p className="mt-2 text-xs text-af-ink-secondary">JPG o PNG. Se recorta como cuadrada y la IA verifica que sea comida.</p>
            </div>
          </div>
        </Campo>
      </section>

      {/* Disponibilidad */}
      <section className="mt-8 space-y-5 rounded-3xl bg-af-surface p-5 sm:p-6">
        <div>
          <h2 className="text-base font-bold text-af-ink">Cómo se muestra</h2>
          <p className="mt-0.5 text-sm text-af-ink-secondary">Decide si tus clientes pueden verlo y pedirlo.</p>
        </div>

        <div>
          <div role="radiogroup" aria-label="Estado del plato" className="grid gap-2 sm:grid-cols-3">
            {ESTADOS.map((definicion) => {
              const activo = estado === definicion.id;
              const Icono = definicion.id === 'disponible' ? Power : definicion.id === 'agotado' ? Ban : EyeOff;
              return (
                <button
                  key={definicion.id}
                  type="button"
                  role="radio"
                  aria-checked={activo}
                  onClick={() => aplicarEstado(definicion.id)}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-150 outline-none ${
                    activo
                      ? 'bg-af-accent text-white'
                      : 'bg-af-ground text-af-ink-secondary hover:bg-af-ink/[0.04] hover:text-af-ink'
                  }`}
                >
                  <Icono size={17} strokeWidth={2.4} />
                  {definicion.nombre}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-af-ink-secondary" aria-live="polite">
            {definicionEstado(estado).descripcion}
          </p>
        </div>

        <Interruptor
          id={`${id}-destacado`}
          activo={!!valores.destacado}
          onChange={(v) => setValue('destacado', v)}
          etiqueta="Destacar en el menú"
          descripcion="Aparece con una etiqueta que llama la atención sobre el resto de la carta."
        />
      </section>

      {/* Guardar: pegado abajo para que no haya que buscarlo.
          La banda `after` tapa el hueco que deja el relleno inferior del panel
          (el elemento pegajoso se detiene antes del borde visible), así que el
          fondo del formulario se ve continuo y no aparece una franja nítida. */}
      <div className="sticky bottom-0 z-20 mt-8 flex items-center gap-2 bg-af-ground/85 px-4 py-3 backdrop-blur-xl after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-40 after:bg-af-ground/85 after:backdrop-blur-xl after:content-[''] sm:gap-3 sm:px-6 sm:py-4">
        {intentoEnvio && Object.keys(errors).length > 0 && (
          <p className="mr-auto hidden text-xs font-medium text-af-danger-text lg:block">
            Revisa los campos marcados en rojo.
          </p>
        )}
        <div className="ml-auto flex flex-1 items-center gap-2 sm:flex-none sm:gap-3">
          <BotonTexto onClick={cancelar} disabled={ocupado} className="flex-1 justify-center sm:flex-none">
            Cancelar
          </BotonTexto>
          <Boton
            type="submit"
            variante="primario"
            tamanio="mediano"
            cargando={guardando}
            disabled={ocupado}
            className="flex-1 sm:flex-none"
          >
            {platillo.id ? 'Guardar cambios' : 'Crear platillo'}
          </Boton>
        </div>
      </div>
    </form>
  );
};
