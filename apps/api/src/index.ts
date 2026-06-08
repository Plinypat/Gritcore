import 'dotenv/config';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { config } from './config.js';
import { pool } from './db/client.js';
import { mkdirSync, createReadStream, existsSync } from 'fs';
import { join } from 'path';

// Plugins
import corsPlugin from './plugins/cors.js';
import authPlugin from './plugins/auth.js';

// Routes
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import orgRoutes from './routes/orgs.js';
import projectRoutes from './routes/projects.js';
import sheetRoutes from './routes/sheets.js';
import reviewRoutes from './routes/reviews.js';
import issueRoutes from './routes/issues.js';

async function bootstrap() {
  // Ensure upload directory exists
  mkdirSync(config.UPLOAD_DIR, { recursive: true });

  const fastify = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        config.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // Register plugins
  await fastify.register(corsPlugin);
  await fastify.register(authPlugin);
  await fastify.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
      files: 1,
    },
  });

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(authRoutes);
  await fastify.register(orgRoutes);
  await fastify.register(projectRoutes);
  await fastify.register(sheetRoutes);
  await fastify.register(reviewRoutes);
  await fastify.register(issueRoutes);

  // Serve uploaded files
  fastify.get('/uploads/*', async (request, reply) => {
    const filePath = (request.params as Record<string, string>)['*'];
    const fullPath = join(config.UPLOAD_DIR, filePath);
    if (!existsSync(fullPath)) {
      return reply.code(404).send({ error: 'File not found' });
    }
    return reply.send(createReadStream(fullPath));
  });

  // Graceful shutdown
  const shutdown = async () => {
    fastify.log.info('Shutting down gracefully...');
    await fastify.close();
    await pool.end();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  try {
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
    fastify.log.info(`GritCore API running on port ${config.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();
