import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { config } from '../../config.js';
import type { AlmacenObjetos } from '../../puertos/almacen.objetos.js';

/** Cliente S3 compatible con RustFS local y con S3/R2 en producción. */
const cliente = new S3Client({
  endpoint: config.S3_ENDPOINT,
  region: config.S3_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: config.S3_ACCESS_KEY,
    secretAccessKey: config.S3_SECRET_KEY,
  },
});

let bucketAsegurado = false;

const existeBucket = async (): Promise<boolean> => {
  try {
    await cliente.send(new HeadBucketCommand({ Bucket: config.S3_BUCKET }));
    return true;
  } catch (error) {
    const estado = (error as { $metadata?: { httpStatusCode?: number } }).$metadata
      ?.httpStatusCode;
    if (estado === 404) return false;
    throw error;
  }
};

/** Adaptador S3/RustFS del puerto `AlmacenObjetos`. */
export const crearAlmacenS3 = (): AlmacenObjetos => {
  const asegurarBucket = async (): Promise<void> => {
    if (bucketAsegurado) return;

    if (!(await existeBucket())) {
      await cliente.send(new CreateBucketCommand({ Bucket: config.S3_BUCKET }));
    }

    const politica = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${config.S3_BUCKET}/*`],
        },
      ],
    };

    await cliente.send(
      new PutBucketPolicyCommand({
        Bucket: config.S3_BUCKET,
        Policy: JSON.stringify(politica),
      }),
    );

    bucketAsegurado = true;
  };

  const subir = async (
    key: string,
    cuerpo: Buffer,
    contentType: string,
  ): Promise<void> => {
    await cliente.send(
      new PutObjectCommand({
        Bucket: config.S3_BUCKET,
        Key: key,
        Body: cuerpo,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
  };

  const urlPublica = (key: string): string =>
    `${config.S3_PUBLIC_URL.replace(/\/+$/, '')}/${key}`;

  return { asegurarBucket, subir, urlPublica };
};
