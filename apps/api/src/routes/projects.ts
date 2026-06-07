import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db/client.js';
import type { JWTPayload, Project } from '@gritcore/types';

export default async function projectRoutes(fastify: FastifyInstance) {
  // GET /projects
  fastify.get('/projects', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { orgId } = request.user as JWTPayload;
    const projects = await query<Project>(
      'SELECT * FROM projects WHERE org_id = $1 ORDER BY created_at DESC',
      [orgId]
    );
    return reply.send({ data: projects });
  });

  // POST /projects
  fastify.post<{
    Body: {
      name: string;
      description?: string;
      phase?: string;
      bid_due_date?: string;
      location?: string;
      gcr_number?: string;
    };
  }>('/projects', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { orgId, userId } = request.user as JWTPayload;
    const { name, description, phase, bid_due_date, location, gcr_number } = request.body;

    if (!name) {
      return reply.code(400).send({ error: 'Bad Request', message: 'name is required', statusCode: 400 });
    }

    const project = await queryOne<Project>(
      `INSERT INTO projects (org_id, name, description, phase, bid_due_date, location, gcr_number, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [orgId, name, description ?? null, phase ?? 'bid', bid_due_date ?? null, location ?? null, gcr_number ?? null, userId]
    );

    return reply.code(201).send({ data: project });
  });

  // GET /projects/:id
  fastify.get<{ Params: { id: string } }>(
    '/projects/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { orgId } = request.user as JWTPayload;
      const { id } = request.params;

      const project = await queryOne<Project>(
        'SELECT * FROM projects WHERE id = $1 AND org_id = $2',
        [id, orgId]
      );

      if (!project) {
        return reply.code(404).send({ error: 'Not Found', message: 'Project not found', statusCode: 404 });
      }

      return reply.send({ data: project });
    }
  );

  // PATCH /projects/:id
  fastify.patch<{
    Params: { id: string };
    Body: Partial<{
      name: string;
      description: string;
      phase: string;
      bid_due_date: string;
      location: string;
      gcr_number: string;
    }>;
  }>('/projects/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { orgId } = request.user as JWTPayload;
    const { id } = request.params;

    const allowed = ['name', 'description', 'phase', 'bid_due_date', 'location', 'gcr_number'] as const;
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
    const project = await queryOne<Project>(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`,
      values
    );

    if (!project) {
      return reply.code(404).send({ error: 'Not Found', message: 'Project not found', statusCode: 404 });
    }

    return reply.send({ data: project });
  });

  // DELETE /projects/:id
  fastify.delete<{ Params: { id: string } }>(
    '/projects/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { orgId, role } = request.user as JWTPayload;
      const { id } = request.params;

      if (role !== 'owner' && role !== 'admin') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Insufficient permissions', statusCode: 403 });
      }

      const result = await query(
        'DELETE FROM projects WHERE id = $1 AND org_id = $2 RETURNING id',
        [id, orgId]
      );

      if (result.length === 0) {
        return reply.code(404).send({ error: 'Not Found', message: 'Project not found', statusCode: 404 });
      }

      return reply.code(204).send();
    }
  );
}
