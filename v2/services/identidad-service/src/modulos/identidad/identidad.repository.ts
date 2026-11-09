import { sql } from '../../db/cliente.js';
import type {
  FilaUsuario,
  Rol,
  UsuarioConCredenciales,
  UsuarioPublico,
} from './identidad.types.js';

/**
 * Acceso a datos de identidad.
 *
 * Es el único archivo del servicio que contiene SQL. Las consultas devuelven
 * filas crudas; el mapeo al dominio ocurre aquí para que el resto del código
 * no conozca los nombres de las columnas.
 */
interface FilaRefresh {
  id: string;
  usuario_id: string;
  token_hash: string;
  expira_en: Date;
  revocado_en: Date | null;
  user_agent: string | null;
  ip: string | null;
}

const aUsuario = (fila: FilaUsuario): UsuarioPublico => ({
  id: fila.id,
  email: fila.email,
  nombre: fila.nombre,
  apellido: fila.apellido,
  rol: fila.rol,
  emailVerificado: Boolean(fila.email_verificado_en),
  creadoEn: fila.creado_en,
});

const aCredenciales = (fila: FilaUsuario): UsuarioConCredenciales => ({
  ...aUsuario(fila),
  passwordHash: fila.password_hash,
});

export const crearUsuario = async (entrada: {
  email: string;
  passwordHash: string;
  nombre: string;
  apellido: string;
  rol: Rol;
}): Promise<UsuarioPublico> => {
  const [fila] = await sql<FilaUsuario[]>`
    insert into usuarios (email, password_hash, nombre, apellido, rol)
    values (${entrada.email}, ${entrada.passwordHash}, ${entrada.nombre},
            ${entrada.apellido}, ${entrada.rol})
    returning id, email, password_hash, nombre, apellido, rol,
              email_verificado_en, creado_en
  `;
  if (!fila) throw new Error('No se pudo crear el usuario.');
  return aUsuario(fila);
};

export const buscarPorEmail = async (
  email: string,
): Promise<UsuarioConCredenciales | null> => {
  const [fila] = await sql<FilaUsuario[]>`
    select id, email, password_hash, nombre, apellido, rol,
           email_verificado_en, creado_en
    from usuarios
    where lower(email) = lower(${email})
    limit 1
  `;
  return fila ? aCredenciales(fila) : null;
};

export const buscarPorId = async (id: string): Promise<UsuarioPublico | null> => {
  const [fila] = await sql<FilaUsuario[]>`
    select id, email, password_hash, nombre, apellido, rol,
           email_verificado_en, creado_en
    from usuarios
    where id = ${id}
    limit 1
  `;
  return fila ? aUsuario(fila) : null;
};

export const guardarRefreshToken = async (entrada: {
  usuarioId: string;
  tokenHash: string;
  expiraEn: Date;
  userAgent?: string | undefined;
  ip?: string | undefined;
}): Promise<void> => {
  await sql`
    insert into refresh_tokens (usuario_id, token_hash, expira_en, user_agent, ip)
    values (${entrada.usuarioId}, ${entrada.tokenHash}, ${entrada.expiraEn},
            ${entrada.userAgent ?? null}, ${entrada.ip ?? null})
  `;
};

export const buscarRefreshVigente = async (
  tokenHash: string,
): Promise<{ usuario: UsuarioPublico; expiraEn: Date } | null> => {
  const [fila] = await sql<(FilaRefresh & FilaUsuario)[]>`
    select t.id, t.usuario_id, t.token_hash, t.expira_en, t.revocado_en,
           t.user_agent, t.ip,
           u.email, u.password_hash, u.nombre, u.apellido, u.rol,
           u.email_verificado_en, u.creado_en
    from refresh_tokens t
    join usuarios u on u.id = t.usuario_id
    where t.token_hash = ${tokenHash}
      and t.revocado_en is null
      and t.expira_en > now()
    limit 1
  `;
  if (!fila) return null;
  return { usuario: aUsuario(fila), expiraEn: fila.expira_en };
};

export const revocarRefreshToken = async (tokenHash: string): Promise<void> => {
  await sql`
    update refresh_tokens
    set revocado_en = now()
    where token_hash = ${tokenHash} and revocado_en is null
  `;
};

export const revocarTodosLosTokens = async (usuarioId: string): Promise<void> => {
  await sql`
    update refresh_tokens
    set revocado_en = now()
    where usuario_id = ${usuarioId} and revocado_en is null
  `;
};

export const registrarAuditoria = async (entrada: {
  usuarioId?: string;
  accion: string;
  detalle?: Record<string, unknown>;
}): Promise<void> => {
  await sql`
    insert into auditoria_identidad (usuario_id, accion, detalle)
    values (${entrada.usuarioId ?? null}, ${entrada.accion},
            ${JSON.stringify(entrada.detalle ?? {})})
  `;
};

export const actualizarCredenciales = async (entrada: {
  usuarioId: string;
  passwordHash: string;
  rol?: Rol | undefined;
}): Promise<void> => {
  await sql`
    update usuarios
    set password_hash = ${entrada.passwordHash},
        rol = coalesce(${entrada.rol ?? null}, rol),
        actualizado_en = now()
    where id = ${entrada.usuarioId}
  `;
};

export const listarUsuarios = async (filtros: {
  q?: string;
  limite: number;
  desde: number;
}): Promise<{ items: UsuarioPublico[]; total: number }> => {
  const q = filtros.q?.trim() || null;
  const filas = await sql<(FilaUsuario & { total: string })[]>`
    select id, email, password_hash, nombre, apellido, rol,
           email_verificado_en, creado_en,
           count(*) over() as total
    from usuarios
    where (
      ${q}::text is null
      or lower(email) like '%' || lower(${q}::text) || '%'
      or lower(nombre || ' ' || apellido) like '%' || lower(${q}::text) || '%'
    )
    order by creado_en desc
    limit ${filtros.limite} offset ${filtros.desde}
  `;
  return {
    items: filas.map(aUsuario),
    total: Number(filas[0]?.total ?? 0),
  };
};

export const resumenUsuarios = async (): Promise<Record<Rol, number>> => {
  const filas = await sql<{ rol: Rol; cantidad: string }[]>`
    select rol, count(*)::text as cantidad
    from usuarios
    group by rol
  `;
  const resumen: Record<Rol, number> = { cliente: 0, dueno: 0, superadmin: 0 };
  for (const fila of filas) resumen[fila.rol] = Number(fila.cantidad);
  return resumen;
};

export const cambiarRol = async (id: string, rol: Rol): Promise<UsuarioPublico | null> => {
  const [fila] = await sql<FilaUsuario[]>`
    update usuarios set rol = ${rol}, actualizado_en = now()
    where id = ${id}
    returning id, email, password_hash, nombre, apellido, rol,
              email_verificado_en, creado_en
  `;
  return fila ? aUsuario(fila) : null;
};
