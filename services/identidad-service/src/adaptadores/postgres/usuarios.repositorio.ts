import { errorConflicto } from '../../dominio/errores.js';
import type {
  EntradaCrearUsuario,
  FiltrosUsuarios,
  Rol,
  UsuarioConCredenciales,
  UsuarioPublico,
} from '../../dominio/usuario.js';
import type {
  EntradaActualizarCredenciales,
  EntradaActualizarPerfil,
  EntradaGuardarRefresh,
  RefreshVigente,
  ResultadoListadoUsuarios,
  UsuariosRepositorio,
} from '../../puertos/usuarios.repositorio.js';
import { sql } from './cliente.js';
import { esViolacionUnica } from './db-errores.js';
import type { FilaRefresh, FilaUsuario } from './tipos.js';

const aUsuario = (fila: FilaUsuario): UsuarioPublico => ({
  id: fila.id,
  email: fila.email,
  nombre: fila.nombre,
  apellido: fila.apellido,
  rol: fila.rol,
  emailVerificado: Boolean(fila.email_verificado_en),
  creadoEn: fila.creado_en,
  avatarUrl: fila.avatar_url ?? null,
});

const aCredenciales = (fila: FilaUsuario): UsuarioConCredenciales => ({
  ...aUsuario(fila),
  passwordHash: fila.password_hash,
});

const crearUsuario = async (entrada: EntradaCrearUsuario): Promise<UsuarioPublico> => {
  try {
    const [fila] = await sql<FilaUsuario[]>`
      insert into usuarios (email, password_hash, nombre, apellido, rol)
      values (${entrada.email}, ${entrada.passwordHash}, ${entrada.nombre},
              ${entrada.apellido}, ${entrada.rol})
      returning id, email, password_hash, nombre, apellido, rol,
                email_verificado_en, creado_en, avatar_url
    `;
    if (!fila) throw new Error('No se pudo crear el usuario.');
    return aUsuario(fila);
  } catch (error) {
    if (esViolacionUnica(error)) {
      throw errorConflicto('Ese correo ya tiene una cuenta.');
    }
    throw error;
  }
};

const buscarPorEmail = async (
  email: string,
): Promise<UsuarioConCredenciales | null> => {
  const [fila] = await sql<FilaUsuario[]>`
    select id, email, password_hash, nombre, apellido, rol,
           email_verificado_en, creado_en, avatar_url
    from usuarios
    where lower(email) = lower(${email})
    limit 1
  `;
  return fila ? aCredenciales(fila) : null;
};

const buscarPorId = async (id: string): Promise<UsuarioPublico | null> => {
  const [fila] = await sql<FilaUsuario[]>`
    select id, email, password_hash, nombre, apellido, rol,
           email_verificado_en, creado_en, avatar_url
    from usuarios
    where id = ${id}
    limit 1
  `;
  return fila ? aUsuario(fila) : null;
};

const guardarRefreshToken = async (entrada: EntradaGuardarRefresh): Promise<void> => {
  await sql`
    insert into refresh_tokens (usuario_id, token_hash, expira_en, user_agent, ip)
    values (${entrada.usuarioId}, ${entrada.tokenHash}, ${entrada.expiraEn},
            ${entrada.userAgent ?? null}, ${entrada.ip ?? null})
  `;
};

const buscarRefreshVigente = async (
  tokenHash: string,
): Promise<RefreshVigente | null> => {
  const [fila] = await sql<(FilaRefresh & FilaUsuario)[]>`
    select t.id, t.usuario_id, t.token_hash, t.expira_en, t.revocado_en,
           t.user_agent, t.ip,
           u.email, u.password_hash, u.nombre, u.apellido, u.rol,
           u.email_verificado_en, u.creado_en, u.avatar_url
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

const revocarRefreshToken = async (tokenHash: string): Promise<void> => {
  await sql`
    update refresh_tokens
    set revocado_en = now()
    where token_hash = ${tokenHash} and revocado_en is null
  `;
};

const actualizarCredenciales = async (
  entrada: EntradaActualizarCredenciales,
): Promise<void> => {
  await sql`
    update usuarios
    set password_hash = ${entrada.passwordHash},
        rol = coalesce(${entrada.rol ?? null}, rol),
        actualizado_en = now()
    where id = ${entrada.usuarioId}
  `;
};

const actualizarPerfil = async (
  entrada: EntradaActualizarPerfil,
): Promise<UsuarioPublico | null> => {
  const campos: Record<string, unknown> = {};
  if (entrada.nombre !== undefined) campos.nombre = entrada.nombre;
  if (entrada.apellido !== undefined) campos.apellido = entrada.apellido;
  if (entrada.avatarUrl !== undefined) campos.avatar_url = entrada.avatarUrl;

  if (Object.keys(campos).length === 0) return buscarPorId(entrada.usuarioId);

  const [fila] = await sql<FilaUsuario[]>`
    update usuarios set ${sql(campos)}, actualizado_en = now()
    where id = ${entrada.usuarioId}
    returning id, email, password_hash, nombre, apellido, rol,
              email_verificado_en, creado_en, avatar_url
  `;
  return fila ? aUsuario(fila) : null;
};

const listarUsuarios = async (
  filtros: FiltrosUsuarios,
): Promise<ResultadoListadoUsuarios> => {
  const q = filtros.q?.trim() || null;
  const filas = await sql<(FilaUsuario & { total: string })[]>`
    select id, email, password_hash, nombre, apellido, rol,
           email_verificado_en, creado_en, avatar_url,
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

const resumenUsuarios = async (): Promise<Record<Rol, number>> => {
  const filas = await sql<{ rol: Rol; cantidad: string }[]>`
    select rol, count(*)::text as cantidad
    from usuarios
    group by rol
  `;
  const resumen: Record<Rol, number> = { cliente: 0, dueno: 0, superadmin: 0 };
  for (const fila of filas) resumen[fila.rol] = Number(fila.cantidad);
  return resumen;
};

const cambiarRol = async (id: string, rol: Rol): Promise<UsuarioPublico | null> => {
  const [fila] = await sql<FilaUsuario[]>`
    update usuarios set rol = ${rol}, actualizado_en = now()
    where id = ${id}
    returning id, email, password_hash, nombre, apellido, rol,
              email_verificado_en, creado_en, avatar_url
  `;
  return fila ? aUsuario(fila) : null;
};

/** Adaptador PostgreSQL del puerto `UsuariosRepositorio`. */
export const crearRepositorioUsuarios = (): UsuariosRepositorio => ({
  crearUsuario,
  buscarPorEmail,
  buscarPorId,
  guardarRefreshToken,
  buscarRefreshVigente,
  revocarRefreshToken,
  actualizarCredenciales,
  actualizarPerfil,
  listarUsuarios,
  resumenUsuarios,
  cambiarRol,
});
