/** Roles de la plataforma. `dueno` administra un restaurante. */
export type Rol = 'cliente' | 'dueno' | 'superadmin';

export const ETIQUETA_ROL: Record<Rol, string> = {
  cliente: 'Comensal',
  dueno: 'Dueño de restaurante',
  superadmin: 'Superadministrador',
};

export const esRol = (valor: unknown): valor is Rol =>
  valor === 'cliente' || valor === 'dueno' || valor === 'superadmin';
