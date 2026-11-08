import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { errorNoAutorizado, errorValidacion } from '../../lib/errores.js';
import { DESTINOS } from '../../lib/validar-archivo.js';
import * as servicio from './media.service.js';

const parametros = z.object({ destino: z.enum(DESTINOS) });

const usuarioDe = (request: FastifyRequest) => {
  if (!request.usuario) throw errorNoAutorizado('Inicia sesión para continuar.');
  return request.usuario;
};

export const subir = async (request: FastifyRequest, reply: FastifyReply) => {
  const { destino } = parametros.parse(request.query);
  const archivo = await request.file();
  if (!archivo) throw errorValidacion('Adjunta una imagen.');

  const contenido = await archivo.toBuffer();
  const media = await servicio.subir(usuarioDe(request), {
    contentType: archivo.mimetype,
    bytes: contenido.length,
    destino,
    contenido,
  });

  return reply.code(201).send(media);
};

export const listarMios = async (request: FastifyRequest, reply: FastifyReply) => {
  return reply.code(200).send({
    items: await servicio.listarMios(usuarioDe(request)),
  });
};
