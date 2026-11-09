/**
 * Puerto hacia restaurantes-service. La aplicación no sabe si el chequeo se
 * hace por HTTP, gRPC o un doble de prueba.
 */
export interface RestaurantesCliente {
  verificarRestaurante(restauranteId: string): Promise<void>;
  verificarPropietario(restauranteId: string, token: string): Promise<void>;
}
