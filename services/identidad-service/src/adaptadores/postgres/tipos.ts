import type { Rol } from '../../dominio/usuario.js';

/** Fila cruda de PostgreSQL; el mapeo vive en el adaptador. */
export interface FilaUsuario {
  id: string;
  email: string;
  password_hash: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  email_verificado_en: Date | null;
  creado_en: Date;
  avatar_url: string | null;
}

export interface FilaRefresh {
  id: string;
  usuario_id: string;
  token_hash: string;
  expira_en: Date;
  revocado_en: Date | null;
  user_agent: string | null;
  ip: string | null;
}
