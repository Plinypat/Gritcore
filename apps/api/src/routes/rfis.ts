import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db/client.js';
import type { JWTPayload } from '@gritcore/types';

export default async function rfiRoutes(fastify: FastifyInstance) {
  // POST /projects/:id/rfis
  fastify.post<{ Params: { id: string } }>(
    '/projects/:id/rfis',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { orgId, userId } = request.user as JWTPayload;
      const { id: projectId } = request.params;
      const { subject, question, priority, issue_id, sheet_id, due_date } = request.body as any;

      const project = await queryOne(
        'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
        [projectId, orgId]
      );
      if (!project) return reply.code(404).send({ error: 'Not Found', message: 'Project not found', statusCode: 404 });

      // Auto-number
      const countRow = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM rfis WHERE project_id = $1',
        [projectId]
      );
      const num = (parseInt(countRow?.count ?? '0') + 1).toString().padStart(3, '0');
      const rfiNumber = `RFI-${num}`;

      const rfi = await queryOne(
        `INSERT INTO rfis (project_id, org_id, rfi_number, subject, question, priority, issue_id, sheet_id, due_date, submitted_by, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft') RETURNING *`,
        [projectId, orgId, rfiNumber, subject, question, priority ?? 'medium', issue_id ?? null, sheet_id ?? null, due_date ?? null, userId]
      );

      return reply.code(201).send({ data: rfi });
    }
  );

  // GET /projects/:id/rfis
  fastify.get<{ Params: { id: string } }>(
    '/projects/:id/rfis',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { orgId } = request.user as JWTPayload;
      const { id: projectId } = request.params;

      const project = await queryOne(
        'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
        [projectId, orgId]
      );
      if (!project) return reply.code(404).send({ error: 'Not Found', message: 'Project not found', statusCode: 404 });

      const rfis = await query(
        'SELECT * FROM rfis WHERE project_id = $1 AND org_id = $2 ORDER BY created_at DESC',
        [projectId, orgId]
      );

      return reply.send({ data: rfis });
    }
  );

  // GET /rfis/:id
  fastify.get<{ Params: { id: string } }>(
    '/rfis/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { orgId } = request.user as JWTPayload;
      const rfi = await queryOne(
        'SELECT * FROM rfis WHERE id = $1 AND org_id = $2',
        [request.params.id, orgId]
      );
      if (!rfi) return reply.code(404).send({ error: 'Not Found', message: 'RFI not found', statusCode: 404 });
      return reply.send({ data: rfi });
    }
  );

  // PATCH /rfis/:id
  fastify.patch<{ Params: { id: string } }>(
    '/rfis/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { orgId } = request.user as JWTPayload;
      const { answer, status, priority, due_date } = request.body as any;

      const rfi = await queryOne(
        'SELECT * FROM rfis WHERE id = $1 AND org_id = $2',
        [request.params.id, orgId]
      );
      if (!rfi) return reply.code(404).send({ error: 'Not Found', message: 'RFI not found', statusCode: 404 });

      const updated = await queryOne(
        `UPDATE rfis SET
          answer = COALESCE($1, answer),
          status = COALESCE($2, status),
          priority = COALESCE($3, priority),
          due_date = COALESCE($4, due_date)
         WHERE id = $5 RETURNING *`,
        [answer ?? null, status ?? null, priority ?? null, due_date ?? null, request.params.id]
      );

      return reply.send({ data: updated });
    }
  );

  // POST /rfis/:id/submit
  fastify.post<{ Params: { id: string } }>(
    '/rfis/:id/submit',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { orgId } = request.user as JWTPayload;
      const rfi = await queryOne(
        'SELECT * FROM rfis WHERE id = $1 AND org_id = $2',
        [request.params.id, orgId]
      );
      if (!rfi) return reply.code(404).send({ error: 'Not Found', message: 'RFI not found', statusCode: 404 });

      const updated = await queryOne(
        `UPDATE rfis SET status = 'submitted', submitted_at = NOW() WHERE id = $1 RETURNING *`,
        [request.params.id]
      );

      return reply.send({ data: updated });
    }
  );

  // DELETE /rfis/:id
  fastify.delete<{ Params: { id: string } }>(
    '/rfis/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { orgId } = request.user as JWTPayload;
      const rfi = await queryOne(
        'SELECT * FROM rfis WHERE id = $1 AND org_id = $2',
        [request.params.id, orgId]
      );
      if (!rfi) return reply.code(404).send({ error: 'Not Found', message: 'RFI not found', statusCode: 404 });

      await queryOne('DELETE FROM rfis WHERE id = $1', [request.params.id]);
      return reply.code(204).send();
    }
  );
}
