import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CasosDeUsoMedia } from '../../aplicacion/casos-uso.js';
import { errorNoAutorizado, errorValidacion } from '../../dominio/errores.js';
import { esquemaDestino } from './media.esquemas.js';

const usuarioDe = (request: FastifyRequest) => {
  if (!request.usuario) throw errorNoAutorizado('Inicia sesión para continuar.');
  return request.usuario;
};

/** Adaptador de entrada HTTP: multipart y JSON hacia casos de uso. */
export const crearControlador = (servicios: CasosDeUsoMedia) => ({
  subir: async (request: FastifyRequest, reply: FastifyReply) => {
    const { destino } = esquemaDestino.parse(request.query);
    const archivo = await request.file();
    if (!archivo) throw errorValidacion('Adjunta una imagen.');

    const contenido = await archivo.toBuffer();
    const media = await servicios.subir(usuarioDe(request), {
      contentType: archivo.mimetype,
      bytes: contenido.length,
      destino,
      contenido,
    });

    return reply.code(201).send(media);
  },

  listarMios: async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send({
      items: await servicios.listarMios(usuarioDe(request)),
    });
  },
});
