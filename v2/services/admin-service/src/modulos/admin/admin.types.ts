import type { Restaurante, Rol } from '@tuki/dominio';

export interface ContextoAutenticacion {
  usuarioId: string;
  rol: Rol;
  email: string;
}

export interface UsuarioAdmin {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  emailVerificado: boolean;
  creadoEn: string;
}

export interface RestauranteAdmin extends Restaurante {
  duenoId: string;
}

export interface ResumenUsuarios {
  cliente: number;
  dueno: number;
  superadmin: number;
}

export interface ResumenRestaurantes {
  total: number;
  activos: number;
}

export interface ResumenPedidos {
  total: number;
  pendientes: number;
  ingresos: number;
}

export interface Panorama {
  usuarios: ResumenUsuarios;
  restaurantes: ResumenRestaurantes;
  pedidos: ResumenPedidos;
}

export interface Auditoria {
  id: string;
  actorId: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  detalle: Record<string, unknown>;
  creadoEn: string;
}
