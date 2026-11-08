import type { Resena, Rol } from '@tuki/dominio';

/** Identidad que llega en el JWT. */
export interface ContextoAutenticacion {
  usuarioId: string;
  rol: Rol;
  email: string;
}

export interface EntradaResena {
  restauranteId: string;
  platilloId?: string | null;
  nombreCliente: string;
  calificacion: number;
  comentario?: string | null;
  fotoUrl?: string | null;
}

export interface ResumenResenas {
  promedio: number;
  cantidad: number;
}

export interface FilaResena {
  id: string;
  restaurante_id: string;
  platillo_id: string | null;
  usuario_id: string;
  nombre_cliente: string;
  calificacion: number;
  comentario: string | null;
  foto_url: string | null;
  respuesta_dueno: string | null;
  visible: boolean;
  creado_en: Date;
  utiles: string;
}

export type ResenaConUtiles = Resena;
