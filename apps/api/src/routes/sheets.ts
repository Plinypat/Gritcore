import type { FastifyInstance } from 'fastify';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { query, queryOne } from '../db/client.js';
import { config } from '../config.js';
import type { JWTPayload, Sheet } from '@gritcore/types';

export default async function sheetRoutes(fastify: FastifyInstance) {
  // POST /projects/:id/sheets — multipart upload
  fastify.post<{ Params: { id: string } }>(
    '/projects/:id/sheets',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { orgId, userId } = request.user as JWTPayload;
      const { id: projectId } = request.params;

      // Verify project belongs to org
      const project = await queryOne(
        'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
        [projectId, orgId]
      );
      if (!project) {
        return reply.code(404).send({ error: 'Not Found', message: 'Project not found', statusCode: 404 });
      }

      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ error: 'Bad Request', message: 'No file uploaded', statusCode: 400 });
      }

      // Save to local uploads dir
      const uploadDir = join(config.UPLOAD_DIR, orgId, projectId);
      mkdirSync(uploadDir, { recursive: true });

      const filename = `${Date.now()}-${data.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filepath = join(uploadDir, filename);

      await pipeline(data.file, createWriteStream(filepath));

      const fileUrl = `/uploads/${orgId}/${projectId}/${filename}`;

      // Parse sheet name from filename (strip extension)
      const sheetName = data.filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
      const fileSize = data.file.bytesRead ?? 0;

      const sheet = await queryOne<Sheet>(
        `INSERT INTO sheets (project_id, org_id, name, sheet_number, discipline, file_url, file_size, status, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ready', $8) RETURNING *`,
        [projectId, orgId, sheetName, data.fields?.sheet_number ?? null, data.fields?.discipline ?? null, fileUrl, fileSize, userId]
      );

      // Increment org usage
      await query('UPDATE orgs SET sheets_used = sheets_used + 1 WHERE id = $1', [orgId]);

      return reply.code(201).send({ data: sheet });
    }
  );

  // GET /projects/:id/sheets
  fastify.get<{ Params: { id: string } }>(
    '/projects/:id/sheets',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { orgId } = request.user as JWTPayload;
      const { id: projectId } = request.params;

      const project = await queryOne(
        'SELECT id FROM projects WHERE id = $1 AND org_id = $2',
        [projectId, orgId]
      );
      if (!project) {
        return reply.code(404).send({ error: 'Not Found', message: 'Project not found', statusCode: 404 });
      }

      const sheets = await query<Sheet>(
        'SELECT * FROM sheets WHERE project_id = $1 AND org_id = $2 ORDER BY created_at DESC',
        [projectId, orgId]
      );

      return reply.send({ data: sheets });
    }
  );

  // GET /sheets/:id
  fastify.get<{ Params: { id: string } }>(
    '/sheets/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { orgId } = request.user as JWTPayload;
      const { id } = request.params;

      const sheet = await queryOne<Sheet>(
        'SELECT * FROM sheets WHERE id = $1 AND org_id = $2',
        [id, orgId]
      );

      if (!sheet) {
        return reply.code(404).send({ error: 'Not Found', message: 'Sheet not found', statusCode: 404 });
      }

      return reply.send({ data: sheet });
    }
  );
}
