import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db/client.js';
import type { JWTPayload, Issue } from '@gritcore/types';

export default async function issueRoutes(fastify: FastifyInstance) {
  // GET /issues — list issues for org, optionally filtered by review
  fastify.get<{
    Querystring: { review_id?: string; severity?: string; status?: string; limit?: string; offset?: string };
  }>('/issues', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { orgId } = request.user as JWTPayload;
    const { review_id, severity, status, limit = '50', offset = '0' } = request.query;

    const conditions: string[] = ['org_id = $1'];
    const values: unknown[] = [orgId];
    let idx = 2;

    if (review_id) { conditions.push(`review_id = $${idx++}`); values.push(review_id); }
    if (severity) { conditions.push(`severity = $${idx++}`); values.push(severity); }
    if (status) { conditions.push(`status = $${idx++}`); values.push(status); }

    values.push(parseInt(limit), parseInt(offset));
    const issues = await query<Issue>(
      `SELECT * FROM issues WHERE ${conditions.join(' AND ')}
       ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 WHEN 'info' THEN 3 WHEN 'passed' THEN 4 END, created_at
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    const [countRow] = await query<{ count: string }>(
      `SELECT COUNT(*) FROM issues WHERE ${conditions.slice(0, -0).join(' AND ')}`,
      values.slice(0, -2)
    );

    return reply.send({
      data: issues,
      meta: { total: parseInt(countRow?.count ?? '0'), limit: parseInt(limit), offset: parseInt(offset) },
    });
  });

  // PATCH /issues/:id
  fastify.patch<{
    Params: { id: string };
    Body: Partial<{ status: string; assigned_to: string | null }>;
  }>('/issues/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { orgId } = request.user as JWTPayload;
    const { id } = request.params;

    const allowed = ['status', 'assigned_to'] as const;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const key of allowed) {
      if (key in request.body) {
        fields.push(`${key} = $${idx++}`);
        values.push((request.body as any)[key]);
      }
    }

    if (fields.length === 0) {
      return reply.code(400).send({ error: 'Bad Request', message: 'No fields to update', statusCode: 400 });
    }

    values.push(id, orgId);
    const issue = await queryOne<Issue>(
      `UPDATE issues SET ${fields.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`,
      values
    );

    if (!issue) {
      return reply.code(404).send({ error: 'Not Found', message: 'Issue not found', statusCode: 404 });
    }

    return reply.send({ data: issue });
  });

  // GET /issues/:id
  fastify.get<{ Params: { id: string } }>(
    '/issues/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { orgId } = request.user as JWTPayload;
      const { id } = request.params;

      const issue = await queryOne<Issue>(
        'SELECT * FROM issues WHERE id = $1 AND org_id = $2',
        [id, orgId]
      );

      if (!issue) {
        return reply.code(404).send({ error: 'Not Found', message: 'Issue not found', statusCode: 404 });
      }

      return reply.send({ data: issue });
    }
  );
}
