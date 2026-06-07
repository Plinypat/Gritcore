import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { config } from '../config.js';
import type { JWTPayload } from '@gritcore/types';

export default fp(async (fastify) => {
  await fastify.register(jwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: '15m' },
  });

  fastify.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token', statusCode: 401 });
    }
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
  }
}
