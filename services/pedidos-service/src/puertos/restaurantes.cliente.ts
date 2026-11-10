/** Menú público mínimo que necesita el carrito. */
export interface MenuPublico {
  restaurante: {
    id: string;
    nombre: string;
    slug: string;
    whatsapp: string | null;
    telefono: string | null;
  };
  platillos: {
    id: string;
    nombre: string;
    precio: number;
    disponible: boolean;
    activo: boolean;
  }[];
}

/**
 * Puerto hacia restaurantes-service. La aplicación no sabe si mañana se
 * reemplaza por gRPC, un bus o un doble de prueba.
 */
export interface RestaurantesCliente {
  obtenerMenu(restauranteId: string): Promise<MenuPublico>;
  verificarPropietario(restauranteId: string, token: string): Promise<void>;
}
