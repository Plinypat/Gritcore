import type { FastifyInstance } from 'fastify';
import { pool } from '../db/client.js';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (_request, reply) => {
    let dbOk = false;
    try {
      await pool.query('SELECT 1');
      dbOk = true;
    } catch (_e) {
      dbOk = false;
    }

    const status = dbOk ? 'ok' : 'degraded';
    return reply.code(dbOk ? 200 : 503).send({
      status,
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      services: {
        database: dbOk ? 'ok' : 'error',
      },
    });
  });
}
