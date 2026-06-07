import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db/client.js';
import type { User, JWTPayload } from '@gritcore/types';

interface LoginBody {
  email: string;
  password?: string;
}

export default async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/login
  fastify.post<{ Body: LoginBody }>('/auth/login', async (request, reply) => {
    const { email } = request.body;

    if (!email) {
      return reply.code(400).send({ error: 'Bad Request', message: 'email is required', statusCode: 400 });
    }

    // Look up user by email
    let user = await queryOne<User & { password_hash?: string }>(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (!user) {
      // Pilot: auto-provision user + demo org
      const orgResult = await query<{ id: string }>(
        `INSERT INTO orgs (name, slug, plan) VALUES ($1, $2, 'pro') RETURNING id`,
        [`${email.split('@')[0]}'s Org`, email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()]
      );
      const orgId = orgResult[0].id;

      const userResult = await query<User>(
        `INSERT INTO users (org_id, email, full_name, role) VALUES ($1, $2, $3, 'owner') RETURNING *`,
        [orgId, email.toLowerCase(), email.split('@')[0]]
      );
      user = userResult[0];

      // Seed a demo project
      await query(
        `INSERT INTO projects (org_id, name, description, phase, bid_due_date, location, gcr_number, created_by)
         VALUES ($1, 'Riverside Concrete Slab — Phase 2', 'Mixed-use retail podium, 180,000 sqft post-tension slab', 'bid', NOW() + INTERVAL '14 days', 'San Francisco, CA', 'GCR-2024-0847', $2)`,
        [orgId, user.id]
      );
    }

    const payload: JWTPayload = {
      userId: user.id,
      orgId: user.org_id,
      role: user.role,
    };

    const accessToken = fastify.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = fastify.jwt.sign({ ...payload, type: 'refresh' }, { expiresIn: '7d' });

    return reply.send({
      data: {
        user: {
          id: user.id,
          org_id: user.org_id,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          role: user.role,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 900,
        },
      },
    });
  });

  // POST /auth/refresh
  fastify.post('/auth/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };
    if (!refreshToken) {
      return reply.code(400).send({ error: 'Bad Request', message: 'refreshToken required', statusCode: 400 });
    }

    try {
      const decoded = fastify.jwt.verify<JWTPayload & { type?: string }>(refreshToken);
      if (decoded.type !== 'refresh') {
        return reply.code(401).send({ error: 'Unauthorized', message: 'Not a refresh token', statusCode: 401 });
      }

      const payload: JWTPayload = {
        userId: decoded.userId,
        orgId: decoded.orgId,
        role: decoded.role,
      };

      const accessToken = fastify.jwt.sign(payload, { expiresIn: '15m' });
      const newRefreshToken = fastify.jwt.sign({ ...payload, type: 'refresh' }, { expiresIn: '7d' });

      return reply.send({
        data: {
          tokens: {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: 900,
          },
        },
      });
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid refresh token', statusCode: 401 });
    }
  });

  // GET /auth/me
  fastify.get('/auth/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user as JWTPayload;

    const user = await queryOne<User>(
      'SELECT id, org_id, email, full_name, avatar_url, role, is_active, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return reply.code(404).send({ error: 'Not Found', message: 'User not found', statusCode: 404 });
    }

    return reply.send({ data: user });
  });
}
