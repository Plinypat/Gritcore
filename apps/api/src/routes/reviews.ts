import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db/client.js';
import { reviewSheet } from '../services/ai.js';
import type { JWTPayload, AIReview, Issue } from '@gritcore/types';

export default async function reviewRoutes(fastify: FastifyInstance) {
  // POST /sheets/:id/review — trigger AI review
  fastify.post<{ Params: { id: string } }>(
    '/sheets/:id/review',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { orgId } = request.user as JWTPayload;
      const { id: sheetId } = request.params;

      const sheet = await queryOne(
        'SELECT id FROM sheets WHERE id = $1 AND org_id = $2',
        [sheetId, orgId]
      );

      if (!sheet) {
        return reply.code(404).send({ error: 'Not Found', message: 'Sheet not found', statusCode: 404 });
      }

      // Check for existing running/complete review
      const existing = await queryOne<AIReview>(
        `SELECT * FROM ai_reviews WHERE sheet_id = $1 AND status IN ('running', 'complete') ORDER BY created_at DESC LIMIT 1`,
        [sheetId]
      );

      if (existing?.status === 'running') {
        return reply.code(409).send({ error: 'Conflict', message: 'Review already in progress', statusCode: 409 });
      }

      try {
        // Run synchronously for pilot
        const review = await reviewSheet(sheetId, orgId);

        // Fetch issues for the response
        const issues = await query<Issue>(
          'SELECT * FROM issues WHERE review_id = $1 ORDER BY severity, created_at',
          [review.id]
        );

        return reply.code(201).send({ data: { review, issues } });
      } catch (err: any) {
        fastify.log.error(err, 'AI review failed');
        return reply.code(500).send({ error: 'Internal Server Error', message: 'AI review failed', statusCode: 500 });
      }
    }
  );

  // GET /reviews/:id
  fastify.get<{ Params: { id: string } }>(
    '/reviews/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { orgId } = request.user as JWTPayload;
      const { id } = request.params;

      const review = await queryOne<AIReview>(
        'SELECT * FROM ai_reviews WHERE id = $1 AND org_id = $2',
        [id, orgId]
      );

      if (!review) {
        return reply.code(404).send({ error: 'Not Found', message: 'Review not found', statusCode: 404 });
      }

      const issues = await query<Issue>(
        `SELECT * FROM issues WHERE review_id = $1 ORDER BY
          CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 WHEN 'info' THEN 3 WHEN 'passed' THEN 4 END,
          created_at`,
        [id]
      );

      return reply.send({ data: { review, issues } });
    }
  );

  // GET /sheets/:id/reviews
  fastify.get<{ Params: { id: string } }>(
    '/sheets/:id/reviews',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { orgId } = request.user as JWTPayload;
      const { id: sheetId } = request.params;

      const sheet = await queryOne(
        'SELECT id FROM sheets WHERE id = $1 AND org_id = $2',
        [sheetId, orgId]
      );
      if (!sheet) {
        return reply.code(404).send({ error: 'Not Found', message: 'Sheet not found', statusCode: 404 });
      }

      const reviews = await query<AIReview>(
        'SELECT * FROM ai_reviews WHERE sheet_id = $1 AND org_id = $2 ORDER BY created_at DESC',
        [sheetId, orgId]
      );

      return reply.send({ data: reviews });
    }
  );
}
