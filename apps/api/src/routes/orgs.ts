import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db/client.js';
import type { JWTPayload, Org } from '@gritcore/types';

export default async function orgRoutes(fastify: FastifyInstance) {
  // GET /orgs/me
  fastify.get('/orgs/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { orgId } = request.user as JWTPayload;

    const org = await queryOne<Org>('SELECT * FROM orgs WHERE id = $1', [orgId]);
    if (!org) {
      return reply.code(404).send({ error: 'Not Found', message: 'Org not found', statusCode: 404 });
    }

    return reply.send({ data: org });
  });

  // PATCH /orgs/me
  fastify.patch<{ Body: Partial<{ name: string; slug: string }> }>(
    '/orgs/me',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { orgId, role } = request.user as JWTPayload;
      if (role !== 'owner' && role !== 'admin') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Insufficient permissions', statusCode: 403 });
      }

      const { name, slug } = request.body;
      const fields: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (name) { fields.push(`name = $${idx++}`); values.push(name); }
      if (slug) { fields.push(`slug = $${idx++}`); values.push(slug); }

      if (fields.length === 0) {
        return reply.code(400).send({ error: 'Bad Request', message: 'No fields to update', statusCode: 400 });
      }

      values.push(orgId);
      const org = await queryOne<Org>(
        `UPDATE orgs SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );

      return reply.send({ data: org });
    }
  );

  // GET /orgs/me/usage
  fastify.get('/orgs/me/usage', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { orgId } = request.user as JWTPayload;

    const org = await queryOne<Org>('SELECT sheets_used, sheets_limit, plan FROM orgs WHERE id = $1', [orgId]);
    const [projectCount] = await query<{ count: string }>('SELECT COUNT(*) FROM projects WHERE org_id = $1', [orgId]);
    const [userCount] = await query<{ count: string }>('SELECT COUNT(*) FROM users WHERE org_id = $1', [orgId]);
    const [reviewCount] = await query<{ count: string }>('SELECT COUNT(*) FROM ai_reviews WHERE org_id = $1', [orgId]);

    return reply.send({
      data: {
        sheets_used: org?.sheets_used ?? 0,
        sheets_limit: org?.sheets_limit ?? 10,
        plan: org?.plan ?? 'free',
        projects: parseInt(projectCount?.count ?? '0'),
        users: parseInt(userCount?.count ?? '0'),
        ai_reviews: parseInt(reviewCount?.count ?? '0'),
      },
    });
  });
}
