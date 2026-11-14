import type {
  EntradaActualizarRestaurante,
  EntradaCrearRestaurante,
  EntradaTema,
  FiltrosAdmin,
  RestauranteConDueno,
  ResumenRestaurantes,
  Tema,
  TipoCocina,
} from '../../dominio/restaurante.js';
import type {
  ListadoRestaurantesAdmin,
  RestaurantesRepositorio,
  ResultadoCreacionRestaurante,
} from '../../puertos/restaurantes.repositorio.js';
import { sql } from './cliente.js';
import {
  aRestaurante,
  aRestauranteConDueno,
  aTema,
  aTipoCocina,
} from './mapper.js';
import type { FilaRestaurante, FilaTema } from './tipos.js';

const sinVacios = (datos: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(datos).filter(([, valor]) => valor !== undefined));

const DIAS_POR_DEFECTO = {
  lunes: true,
  martes: true,
  miercoles: true,
  jueves: true,
  viernes: true,
  sabado: true,
  domingo: true,
};

const buscarPorId = async (id: string): Promise<RestauranteConDueno | null> => {
  const [fila] = await sql<FilaRestaurante[]>`
    select * from restaurantes where id = ${id} limit 1
  `;
  return fila ? aRestauranteConDueno(fila) : null;
};

const buscarPorDueno = async (
  duenoId: string,
): Promise<RestauranteConDueno | null> => {
  const [fila] = await sql<FilaRestaurante[]>`
    select * from restaurantes where dueno_id = ${duenoId} order by creado_en limit 1
  `;
  return fila ? aRestauranteConDueno(fila) : null;
};

const existeSlug = async (slug: string): Promise<boolean> => {
  const [fila] = await sql<{ existe: boolean }[]>`
    select exists(select 1 from restaurantes where slug = ${slug}) as existe
  `;
  return Boolean(fila?.existe);
};

const obtenerTema = async (restauranteId: string): Promise<FilaTema | null> => {
  const [fila] = await sql<FilaTema[]>`
    select * from temas where restaurante_id = ${restauranteId} limit 1
  `;
  return fila ?? null;
};

const listarCocinas = async (): Promise<TipoCocina[]> => {
  const filas = await sql<{ id: string; slug: string; nombre: string; icono: string }[]>`
    select id, slug, nombre, icono
    from tipos_cocina
    where activo
    order by orden, nombre
  `;
  return filas.map(aTipoCocina);
};

const cocinasDe = async (restauranteId: string): Promise<TipoCocina[]> => {
  const filas = await sql<{ id: string; slug: string; nombre: string; icono: string }[]>`
    select tc.id, tc.slug, tc.nombre, tc.icono
    from restaurantes_cocinas rc
    join tipos_cocina tc on tc.id = rc.tipo_cocina_id
    where rc.restaurante_id = ${restauranteId}
    order by rc.principal desc, tc.orden
  `;
  return filas.map(aTipoCocina);
};

const crearConBase = async (
  entrada: EntradaCrearRestaurante & { slug: string; duenoId: string },
): Promise<ResultadoCreacionRestaurante> => {
  return sql.begin(async (tx) => {
    const [fila] = await tx<FilaRestaurante[]>`
      insert into restaurantes (
        dueno_id, slug, nombre, descripcion, eslogan, telefono, whatsapp, email,
        direccion, ciudad, departamento, horario_apertura, horario_cierre,
        facebook, instagram, twitter, imagen_logo_url, imagen_banner_url,
        dias_abierto
      ) values (
        ${entrada.duenoId}, ${entrada.slug}, ${entrada.nombre},
        ${entrada.descripcion ?? null}, ${entrada.eslogan ?? null},
        ${entrada.telefono ?? null}, ${entrada.whatsapp ?? null},
        ${entrada.email ?? null}, ${entrada.direccion ?? null},
        ${entrada.ciudad ?? null}, ${entrada.departamento ?? null},
        ${entrada.horarioApertura ?? '09:00'}, ${entrada.horarioCierre ?? '22:00'},
        ${entrada.facebook ?? null}, ${entrada.instagram ?? null},
        ${entrada.twitter ?? null},
        ${entrada.imagenLogoUrl ?? null}, ${entrada.imagenBannerUrl ?? null},
        ${JSON.stringify(entrada.diasAbierto ?? DIAS_POR_DEFECTO)}::jsonb
      )
      returning *
    `;
    if (!fila) throw new Error('No se pudo crear el restaurante.');

    const [tema] = await tx<FilaTema[]>`
      insert into temas (restaurante_id) values (${fila.id}) returning *
    `;

    await tx`
      insert into categorias (restaurante_id, nombre, icono, orden) values
        (${fila.id}, 'Entradas', 'appetizer', 1),
        (${fila.id}, 'Platos principales', 'main-dish', 2),
        (${fila.id}, 'Postres', 'dessert', 3),
        (${fila.id}, 'Bebidas', 'drink', 4)
    `;

    for (const [indice, slugCocina] of entrada.cocinas.entries()) {
      await tx`
        insert into restaurantes_cocinas (restaurante_id, tipo_cocina_id, principal)
        select ${fila.id}, id, ${indice === 0}
        from tipos_cocina where slug = ${slugCocina}
        on conflict do nothing
      `;
    }

    return {
      restaurante: aRestaurante(fila),
      tema: tema ? aTema(tema) : null,
    };
  });
};

const actualizar = async (
  id: string,
  entrada: EntradaActualizarRestaurante,
): Promise<RestauranteConDueno | null> => {
  const { diasAbierto, ...resto } = entrada;
  const cambios = sinVacios({
    nombre: resto.nombre,
    descripcion: resto.descripcion,
    eslogan: resto.eslogan,
    telefono: resto.telefono,
    whatsapp: resto.whatsapp,
    email: resto.email,
    direccion: resto.direccion,
    ciudad: resto.ciudad,
    departamento: resto.departamento,
    horario_apertura: resto.horarioApertura,
    horario_cierre: resto.horarioCierre,
    facebook: resto.facebook,
    instagram: resto.instagram,
    twitter: resto.twitter,
    imagen_logo_url: resto.imagenLogoUrl,
    imagen_banner_url: resto.imagenBannerUrl,
  });

  if (Object.keys(cambios).length > 0) {
    await sql`
      update restaurantes set ${sql(cambios)}, actualizado_en = now()
      where id = ${id}
    `;
  }

  if (diasAbierto) {
    await sql`
      update restaurantes
      set dias_abierto = ${JSON.stringify(diasAbierto)}::jsonb, actualizado_en = now()
      where id = ${id}
    `;
  }

  return buscarPorId(id);
};

const actualizarTema = async (
  restauranteId: string,
  entrada: EntradaTema,
): Promise<Tema | null> => {
  const cambios = sinVacios({
    estilo_plantilla: entrada.estiloPlantilla,
    color_primario: entrada.colorPrimario,
    color_secundario: entrada.colorSecundario,
    color_fondo: entrada.colorFondo,
    color_texto: entrada.colorTexto,
    color_texto_titulos: entrada.colorTextoTitulos,
    color_primario_oscuro: entrada.colorPrimarioOscuro,
    color_secundario_oscuro: entrada.colorSecundarioOscuro,
    color_fondo_oscuro: entrada.colorFondoOscuro,
    color_texto_oscuro: entrada.colorTextoOscuro,
    color_texto_titulos_oscuro: entrada.colorTextoTitulosOscuro,
    fuente_titulos: entrada.fuenteTitulos,
    fuente_cuerpo: entrada.fuenteCuerpo,
  });

  if (Object.keys(cambios).length === 0) {
    const fila = await obtenerTema(restauranteId);
    return fila ? aTema(fila) : null;
  }

  const [fila] = await sql<FilaTema[]>`
    update temas set ${sql(cambios)}, actualizado_en = now()
    where restaurante_id = ${restauranteId}
    returning *
  `;
  return fila ? aTema(fila) : null;
};

const reemplazarCocinas = async (
  restauranteId: string,
  cocinas: string[],
): Promise<void> => {
  await sql.begin(async (tx) => {
    await tx`delete from restaurantes_cocinas where restaurante_id = ${restauranteId}`;
    for (const [indice, slugCocina] of cocinas.entries()) {
      await tx`
        insert into restaurantes_cocinas (restaurante_id, tipo_cocina_id, principal)
        select ${restauranteId}, id, ${indice === 0}
        from tipos_cocina where slug = ${slugCocina}
        on conflict do nothing
      `;
    }
  });
};

const temaDe = async (restauranteId: string): Promise<Tema | null> => {
  const fila = await obtenerTema(restauranteId);
  return fila ? aTema(fila) : null;
};

const listarTodos = async (
  filtros: FiltrosAdmin,
): Promise<ListadoRestaurantesAdmin> => {
  const q = filtros.q?.trim() || null;
  const filas = await sql<(FilaRestaurante & { total: string })[]>`
    select *, count(*) over() as total
    from restaurantes
    where (
      ${q}::text is null
      or normalizar_busqueda(nombre) like '%' || normalizar_busqueda(${q}::text) || '%'
      or normalizar_busqueda(coalesce(ciudad, '')) like '%' || normalizar_busqueda(${q}::text) || '%'
    )
    order by creado_en desc
    limit ${filtros.limite} offset ${filtros.desde}
  `;
  return {
    items: filas.map(aRestauranteConDueno),
    total: Number(filas[0]?.total ?? 0),
  };
};

const resumen = async (): Promise<ResumenRestaurantes> => {
  const [fila] = await sql<{ total: string; activos: string }[]>`
    select count(*)::text as total, count(*) filter (where activo)::text as activos
    from restaurantes
  `;
  return { total: Number(fila?.total ?? 0), activos: Number(fila?.activos ?? 0) };
};

const cambiarActivo = async (
  id: string,
  activo: boolean,
): Promise<RestauranteConDueno | null> => {
  const [fila] = await sql<FilaRestaurante[]>`
    update restaurantes set activo = ${activo}, actualizado_en = now()
    where id = ${id}
    returning *
  `;
  return fila ? aRestauranteConDueno(fila) : null;
};

/** Adaptador PostgreSQL del puerto `RestaurantesRepositorio`. */
export const crearRepositorioRestaurantes = (): RestaurantesRepositorio => ({
  buscarPorId,
  buscarPorDueno,
  existeSlug,
  crearConBase,
  actualizar,
  actualizarTema,
  reemplazarCocinas,
  cocinasDe,
  temaDe,
  listarCocinas,
  listarTodos,
  resumen,
  cambiarActivo,
});
