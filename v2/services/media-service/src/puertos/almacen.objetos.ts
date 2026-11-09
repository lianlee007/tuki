/**
 * Puerto de almacenamiento de objetos. RustFS, S3 o R2 son detalles
 * intercambiables para la aplicación.
 */
export interface AlmacenObjetos {
  asegurarBucket(): Promise<void>;
  subir(key: string, cuerpo: Buffer, contentType: string): Promise<void>;
  urlPublica(key: string): string;
}
