import type {
  FiltrosListado,
  FiltrosPlatos,
  MenuPublico,
  PlatoDescubierto,
  RestauranteDescubierto,
  RestaurantePublico,
} from '../../dominio/restaurante.js';
import type {
  ListadoDescubierto,
  ListadoPlatos,
  PublicoRepositorio,
} from '../../puertos/publico.repositorio.js';
import { sql } from './cliente.js';
import {
  aCategoria,
  aPlatillo,
  aRestaurante,
  aTema,
  aTipoCocina,
} from './mapper.js';
import type {
  FilaCategoria,
  FilaPlatillo,
  FilaRestaurante,
  FilaTema,
} from './tipos.js';

interface FilaListado extends FilaRestaurante {
  platos_cantidad: string;
  precio_min: string | null;
  precio_max: string | null;
  total: string;
}

interface FilaPlato extends FilaPlatillo {
  restaurante_nombre: string;
  restaurante_slug: string;
  ciudad: string | null;
  cocina: string | null;
  total: string;
}

const textoBusqueda = (valor?: string) => {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
};

const obtenerPublico = async (
  slug: string,
): Promise<RestaurantePublico | null> => {
  const [restaurante] = await sql<FilaRestaurante[]>`
    select * from restaurantes where slug = ${slug} and activo limit 1
  `;
  if (!restaurante) return null;

  const [tema] = await sql<FilaTema[]>`
    select * from temas where restaurante_id = ${restaurante.id} limit 1
  `;
  if (!tema) return null;

  const cocinas = await sql<{ id: string; slug: string; nombre: string; icono: string }[]>`
    select tc.id, tc.slug, tc.nombre, tc.icono
    from restaurantes_cocinas rc
    join tipos_cocina tc on tc.id = rc.tipo_cocina_id
    where rc.restaurante_id = ${restaurante.id}
    order by rc.principal desc, tc.orden
  `;

  const categorias = await sql<FilaCategoria[]>`
    select * from categorias
    where restaurante_id = ${restaurante.id} and activo
    order by orden, nombre
  `;

  const platillos = await sql<FilaPlatillo[]>`
    select * from platillos
    where restaurante_id = ${restaurante.id} and activo and disponible
    order by orden, nombre
  `;

  return {
    restaurante: aRestaurante(restaurante),
    tema: aTema(tema),
    cocinas: cocinas.map(aTipoCocina),
    categorias: categorias.map(aCategoria),
    platillos: platillos.map(aPlatillo),
  };
};

const listarRestaurantes = async (
  filtros: FiltrosListado,
): Promise<ListadoDescubierto> => {
  const q = textoBusqueda(filtros.q);
  const cocina = textoBusqueda(filtros.cocina);
  const ciudad = textoBusqueda(filtros.ciudad);

  const filas = await sql<FilaListado[]>`
    with base as (
      select r.*,
        count(p.id) filter (where p.activo and p.disponible) as platos_cantidad,
        min(p.precio) filter (where p.activo and p.disponible) as precio_min,
        max(p.precio) filter (where p.activo and p.disponible) as precio_max
      from restaurantes r
      left join platillos p on p.restaurante_id = r.id
      where r.activo
        and (
          ${q}::text is null
          or normalizar_busqueda(r.nombre || ' ' || coalesce(r.descripcion, ''))
             like '%' || normalizar_busqueda(${q}::text) || '%'
        )
        and (
          ${cocina}::text is null
          or exists (
            select 1 from restaurantes_cocinas rc
            join tipos_cocina tc on tc.id = rc.tipo_cocina_id
            where rc.restaurante_id = r.id and tc.slug = ${cocina}::text
          )
        )
        and (
          ${ciudad}::text is null
          or normalizar_busqueda(coalesce(r.ciudad, ''))
             like '%' || normalizar_busqueda(${ciudad}::text) || '%'
        )
      group by r.id
    )
    select *, count(*) over() as total
    from base
    order by destacado desc, nombre
    limit ${filtros.limite} offset ${filtros.desde}
  `;

  return {
    items: filas.map((fila): RestauranteDescubierto => ({
      ...aRestaurante(fila),
      platosCantidad: Number(fila.platos_cantidad),
      precioMin: fila.precio_min === null ? null : Number(fila.precio_min),
      precioMax: fila.precio_max === null ? null : Number(fila.precio_max),
    })),
    total: Number(filas[0]?.total ?? 0),
  };
};

const buscarPlatos = async (filtros: FiltrosPlatos): Promise<ListadoPlatos> => {
  const q = textoBusqueda(filtros.q);
  const cocina = textoBusqueda(filtros.cocina);
  const ciudad = textoBusqueda(filtros.ciudad);
  const vegetariano = filtros.vegetariano ? filtros.vegetariano === 'true' : null;
  const vegano = filtros.vegano ? filtros.vegano === 'true' : null;
  const picante = filtros.picante ? filtros.picante === 'true' : null;

  const filas = await sql<FilaPlato[]>`
    with base as (
      select p.*, r.nombre as restaurante_nombre, r.slug as restaurante_slug,
             r.ciudad,
             (
               select tc.nombre
               from restaurantes_cocinas rc
               join tipos_cocina tc on tc.id = rc.tipo_cocina_id
               where rc.restaurante_id = r.id
               order by rc.principal desc, tc.orden
               limit 1
             ) as cocina
      from platillos p
      join restaurantes r on r.id = p.restaurante_id
      where p.activo and p.disponible and r.activo
        and (
          ${q}::text is null
          or normalizar_busqueda(p.nombre || ' ' || coalesce(p.descripcion, ''))
             like '%' || normalizar_busqueda(${q}::text) || '%'
          or normalizar_busqueda(r.nombre)
             like '%' || normalizar_busqueda(${q}::text) || '%'
        )
        and (
          ${cocina}::text is null
          or exists (
            select 1 from restaurantes_cocinas rc
            join tipos_cocina tc on tc.id = rc.tipo_cocina_id
            where rc.restaurante_id = r.id and tc.slug = ${cocina}::text
          )
        )
        and (${filtros.precioMin ?? null}::numeric is null or p.precio >= ${filtros.precioMin ?? null})
        and (${filtros.precioMax ?? null}::numeric is null or p.precio <= ${filtros.precioMax ?? null})
        and (${vegetariano}::boolean is null or p.vegetariano = ${vegetariano})
        and (${vegano}::boolean is null or p.vegano = ${vegano})
        and (${picante}::boolean is null or p.picante = ${picante})
        and (
          ${ciudad}::text is null
          or normalizar_busqueda(coalesce(r.ciudad, ''))
             like '%' || normalizar_busqueda(${ciudad}::text) || '%'
        )
    )
    select *, count(*) over() as total
    from base
    order by nombre
    limit ${filtros.limite} offset ${filtros.desde}
  `;

  return {
    items: filas.map((fila): PlatoDescubierto => ({
      ...aPlatillo(fila),
      restauranteNombre: fila.restaurante_nombre,
      restauranteSlug: fila.restaurante_slug,
      ciudad: fila.ciudad,
      cocina: fila.cocina,
    })),
    total: Number(filas[0]?.total ?? 0),
  };
};

const obtenerMenuPublico = async (
  restauranteId: string,
): Promise<MenuPublico | null> => {
  const [restaurante] = await sql<{
    id: string;
    nombre: string;
    slug: string;
    whatsapp: string | null;
    telefono: string | null;
  }[]>`
    select id, nombre, slug, whatsapp, telefono
    from restaurantes
    where id = ${restauranteId} and activo
    limit 1
  `;
  if (!restaurante) return null;

  const platillos = await sql<FilaPlatillo[]>`
    select * from platillos
    where restaurante_id = ${restauranteId} and activo and disponible
    order by orden, nombre
  `;

  return {
    restaurante,
    platillos: platillos.map(aPlatillo),
  };
};

/** Adaptador PostgreSQL del puerto `PublicoRepositorio`. */
export const crearRepositorioPublico = (): PublicoRepositorio => ({
  obtenerPublico,
  listarRestaurantes,
  buscarPlatos,
  obtenerMenuPublico,
});
