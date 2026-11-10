import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CasosDeUsoIdentidad } from '../../aplicacion/casos-uso.js';
import { errorNoAutorizado } from '../../dominio/errores.js';
import {
  esquemaLogin,
  esquemaLogout,
  esquemaPerfil,
  esquemaRefresh,
  esquemaRegistro,
} from './identidad.esquemas.js';

/** Metadatos del dispositivo que acompañan al refresco. */
const contextoDe = (request: FastifyRequest) => {
  const agente = request.headers['user-agent'];
  return {
    userAgent: Array.isArray(agente) ? agente.join(' ') : agente,
    ip: request.ip,
  };
};

const usuarioDe = (request: FastifyRequest) => {
  if (!request.usuario) throw errorNoAutorizado('Inicia sesión para continuar.');
  return request.usuario;
};

/** Adaptador de entrada HTTP de las rutas públicas y de cuenta. */
export const crearControlador = (casos: CasosDeUsoIdentidad) => ({
  registrar: async (request: FastifyRequest, reply: FastifyReply) => {
    const entrada = esquemaRegistro.parse(request.body);
    const sesion = await casos.registrar(entrada, contextoDe(request));
    return reply.code(201).send(sesion);
  },

  iniciarSesion: async (request: FastifyRequest, reply: FastifyReply) => {
    const entrada = esquemaLogin.parse(request.body);
    const sesion = await casos.iniciarSesion(entrada, contextoDe(request));
    return reply.code(200).send(sesion);
  },

  refrescar: async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = esquemaRefresh.parse(request.body);
    const sesion = await casos.refrescar(refreshToken, contextoDe(request));
    return reply.code(200).send(sesion);
  },

  cerrarSesion: async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = esquemaLogout.parse(request.body);
    await casos.cerrarSesion(refreshToken);
    return reply.code(204).send();
  },

  perfil: async (request: FastifyRequest, reply: FastifyReply) => {
    const usuario = await casos.obtenerPerfil(usuarioDe(request).usuarioId);
    return reply.code(200).send({ usuario });
  },

  actualizarPerfil: async (request: FastifyRequest, reply: FastifyReply) => {
    const entrada = esquemaPerfil.parse(request.body);
    const usuario = await casos.actualizarPerfil(usuarioDe(request), entrada);
    return reply.code(200).send({ usuario });
  },
});
