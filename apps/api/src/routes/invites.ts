import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db/client.js';
import type { JWTPayload, User } from '@gritcore/types';

export default async function inviteRoutes(fastify: FastifyInstance) {
  // POST /orgs/me/invites OR /orgs/:orgId/invites — send invite
  async function handleSendInvite(request: any, reply: any) {
    const { orgId, userId, role: callerRole } = request.user as JWTPayload;
    if (callerRole !== 'owner' && callerRole !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden', message: 'Only owners and admins can invite', statusCode: 403 });
    }

    const { email, role } = request.body as { email: string; role: string };
    if (!email) return reply.code(400).send({ error: 'Bad Request', message: 'email required', statusCode: 400 });

    const existing = await queryOne('SELECT id FROM users WHERE email = $1 AND org_id = $2', [email.toLowerCase(), orgId]);
    if (existing) return reply.code(409).send({ error: 'Conflict', message: 'User already in org', statusCode: 409 });

    const invite = await queryOne(
      `INSERT INTO org_invites (org_id, email, role, invited_by) VALUES ($1, $2, $3, $4) RETURNING *`,
      [orgId, email.toLowerCase(), role ?? 'viewer', userId]
    );

    return reply.code(201).send({ data: invite });
  }

  fastify.post('/orgs/me/invites', { preHandler: [fastify.authenticate] }, handleSendInvite);
  fastify.post('/orgs/:orgId/invites', { preHandler: [fastify.authenticate] }, handleSendInvite);

  // GET /orgs/me/invites — list pending invites
  fastify.get('/orgs/me/invites', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { orgId } = request.user as JWTPayload;
    const invites = await query(
      `SELECT i.*, u.full_name as invited_by_name
       FROM org_invites i
       LEFT JOIN users u ON u.id = i.invited_by
       WHERE i.org_id = $1 AND i.accepted = false AND i.expires_at > NOW()
       ORDER BY i.created_at DESC`,
      [orgId]
    );
    return reply.send({ data: invites });
  });

  // GET /invites/:token — public: get invite info
  fastify.get<{ Params: { token: string } }>('/invites/:token', async (request, reply) => {
    const invite = await queryOne(
      `SELECT i.*, o.name as org_name
       FROM org_invites i
       JOIN orgs o ON o.id = i.org_id
       WHERE i.token = $1 AND i.accepted = false AND i.expires_at > NOW()`,
      [request.params.token]
    );
    if (!invite) return reply.code(404).send({ error: 'Not Found', message: 'Invite not found or expired', statusCode: 404 });
    return reply.send({ data: invite });
  });

  // POST /invites/:token/accept — public: accept invite, create user, return JWT
  fastify.post<{ Params: { token: string } }>('/invites/:token/accept', async (request, reply) => {
    const { full_name } = request.body as { full_name: string };

    const invite = await queryOne<any>(
      `SELECT * FROM org_invites WHERE token = $1 AND accepted = false AND expires_at > NOW()`,
      [request.params.token]
    );
    if (!invite) return reply.code(404).send({ error: 'Not Found', message: 'Invite not found or expired', statusCode: 404 });

    const user = await queryOne<User>(
      `INSERT INTO users (org_id, email, full_name, role) VALUES ($1, $2, $3, $4) RETURNING *`,
      [invite.org_id, invite.email, full_name ?? invite.email.split('@')[0], invite.role]
    );

    await queryOne('UPDATE org_invites SET accepted = true WHERE id = $1', [invite.id]);

    const payload: JWTPayload = { userId: user!.id, orgId: user!.org_id, role: user!.role };
    const accessToken = fastify.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = fastify.jwt.sign({ ...payload, type: 'refresh' }, { expiresIn: '7d' });

    return reply.send({
      data: {
        user: { id: user!.id, org_id: user!.org_id, email: user!.email, full_name: user!.full_name, role: user!.role },
        tokens: { accessToken, refreshToken, expiresIn: 900 },
      },
    });
  });

  // DELETE /orgs/me/invites/:id — revoke invite
  fastify.delete<{ Params: { id: string } }>('/orgs/me/invites/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { orgId } = request.user as JWTPayload;
    await queryOne('DELETE FROM org_invites WHERE id = $1 AND org_id = $2', [request.params.id, orgId]);
    return reply.code(204).send();
  });
}
