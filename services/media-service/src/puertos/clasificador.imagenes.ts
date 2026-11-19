/**
 * Puerto del clasificador de fotos.
 *
 * El servicio de visión responde si una imagen parece comida. Aquí no importa
 * cómo lo decide: el caso de uso solo necesita la respuesta y debe poder
 * probarse sin red.
 */
export interface ClasificadorImagenes {
  /**
   * `true` si la foto parece comida, `false` si no.
   * `null` cuando no se pudo comprobar (servicio caído, timeout, respuesta
   * inesperada): quien llama decide si deja pasar la subida.
   */
  esComida(contenido: Buffer, contentType: string): Promise<boolean | null>;
}
