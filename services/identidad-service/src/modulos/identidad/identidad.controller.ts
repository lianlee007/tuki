import type { FastifyReply, FastifyRequest } from 'fastify';
import { errorNoAutorizado } from '../../lib/errores.js';
import * as servicio from './identidad.service.js';
import {
  esquemaLogin,
  esquemaLogout,
  esquemaRefresh,
  esquemaRegistro,
} from './identidad.schema.js';

/** Metadatos del dispositivo que acompañan al refresco. */
const contextoDe = (request: FastifyRequest) => {
  const agente = request.headers['user-agent'];
  return {
    userAgent: Array.isArray(agente) ? agente.join(' ') : agente,
    ip: request.ip,
  };
};

export const registrar = async (request: FastifyRequest, reply: FastifyReply) => {
  const entrada = esquemaRegistro.parse(request.body);
  const sesion = await servicio.registrar(entrada, contextoDe(request));
  return reply.code(201).send(sesion);
};

export const iniciarSesion = async (request: FastifyRequest, reply: FastifyReply) => {
  const entrada = esquemaLogin.parse(request.body);
  const sesion = await servicio.iniciarSesion(entrada, contextoDe(request));
  return reply.code(200).send(sesion);
};

export const refrescar = async (request: FastifyRequest, reply: FastifyReply) => {
  const { refreshToken } = esquemaRefresh.parse(request.body);
  const sesion = await servicio.refrescar(refreshToken, contextoDe(request));
  return reply.code(200).send(sesion);
};

export const cerrarSesion = async (request: FastifyRequest, reply: FastifyReply) => {
  const { refreshToken } = esquemaLogout.parse(request.body);
  await servicio.cerrarSesion(refreshToken);
  return reply.code(204).send();
};

export const perfil = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.usuario) {
    throw errorNoAutorizado('Inicia sesión para continuar.');
  }
  const usuario = await servicio.obtenerPerfil(request.usuario.usuarioId);
  return reply.code(200).send({ usuario });
};
