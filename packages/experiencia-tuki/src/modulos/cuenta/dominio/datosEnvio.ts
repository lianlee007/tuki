/**
 * Datos de envío de una cuenta.
 *
 * Son las reglas puras que comparten el registro, «Mi cuenta» y los carritos:
 * qué teléfono vale, cómo se compone la dirección que se envía por WhatsApp y
 * cuándo se considera que la cuenta ya puede pedir sin escribir todo otra vez.
 * No dependen de React ni de Supabase para poder probarlas aisladas.
 */

export interface DatosEnvio {
  telefono: string;
  direccion: string;
  barrio: string;
  referencias: string;
}

export interface DatosEnvioCuenta extends DatosEnvio {
  /** Última vez que se guardaron los datos; `null` si nunca. */
  actualizadoEn: string | null;
  /** Última vez que la persona prefirió completarlos más tarde. */
  omitidoEn: string | null;
}

export const DATOS_ENVIO_VACIOS: DatosEnvio = {
  telefono: '',
  direccion: '',
  barrio: '',
  referencias: '',
};

/** Límites compartidos por el formulario y el esquema de la base de datos. */
export const LIMITES_ENVIO = {
  telefono: 10,
  direccion: 200,
  barrio: 60,
  referencias: 160,
} as const;

export const soloDigitos = (valor: string): string =>
  String(valor ?? '').replace(/\D/g, '');

/** Un celular o fijo colombiano: diez dígitos, sin indicativo. */
export const telefonoValido = (valor: string): boolean =>
  soloDigitos(valor).length === 10;

export const direccionValida = (valor: string): boolean => {
  const texto = String(valor ?? '').trim();
  return texto.length >= 5 && texto.length <= LIMITES_ENVIO.direccion;
};

export const barrioValido = (valor: string): boolean => {
  const texto = String(valor ?? '').trim();
  return texto.length >= 2 && texto.length <= LIMITES_ENVIO.barrio;
};

export const referenciasValidas = (valor: string): boolean =>
  String(valor ?? '').trim().length <= LIMITES_ENVIO.referencias;

/**
 * La cuenta está lista para pedir sin volver a escribir sus datos. El barrio
 * forma parte de la dirección de entrega: sin él, el repartidor no sabe dónde
 * termina la Calle 5 # 10-20.
 */
export const datosEnvioCompletos = (
  datos: Pick<DatosEnvio, 'telefono' | 'direccion' | 'barrio'> | null | undefined
): boolean =>
  Boolean(
    datos &&
      telefonoValido(datos.telefono) &&
      direccionValida(datos.direccion) &&
      barrioValido(datos.barrio)
  );

export type ErroresDatosEnvio = Partial<Record<keyof DatosEnvio, string>>;

/** Devuelve un mensaje por campo; vacío significa que el formulario es válido. */
export const erroresDatosEnvio = (datos: DatosEnvio): ErroresDatosEnvio => {
  const errores: ErroresDatosEnvio = {};

  if (!telefonoValido(datos.telefono)) {
    errores.telefono = 'Escribe un teléfono de 10 dígitos.';
  }
  if (!direccionValida(datos.direccion)) {
    errores.direccion = 'Escribe tu dirección (mínimo 5 caracteres).';
  }
  if (!barrioValido(datos.barrio)) {
    errores.barrio = 'Escribe el barrio o la localidad.';
  }
  if (!referenciasValidas(datos.referencias)) {
    errores.referencias = `Máximo ${LIMITES_ENVIO.referencias} caracteres.`;
  }

  return errores;
};

/** Limpia espacios y deja el teléfono solo con dígitos antes de guardar. */
export const normalizarDatosEnvio = (datos: DatosEnvio): DatosEnvio => ({
  telefono: soloDigitos(datos.telefono),
  direccion: String(datos.direccion ?? '').trim(),
  barrio: String(datos.barrio ?? '').trim(),
  referencias: String(datos.referencias ?? '').trim(),
});

/**
 * Dirección de una línea para el mensaje de WhatsApp y los resúmenes:
 * «Calle 5 # 10-20, Centro (Torre 2, apto 301)».
 */
export const formatearDireccionEnvio = (
  datos: Pick<DatosEnvio, 'direccion' | 'barrio' | 'referencias'>
): string => {
  const direccion = String(datos.direccion ?? '').trim();
  const barrio = String(datos.barrio ?? '').trim();
  const referencias = String(datos.referencias ?? '').trim();

  if (!direccion && !barrio) return '';

  const base = [direccion, barrio].filter(Boolean).join(', ');
  return referencias ? `${base} (${referencias})` : base;
};
