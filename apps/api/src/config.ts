import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16).optional(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-').optional(),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  UPLOAD_DIR: z.string().default('./uploads'),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('eu-central-1'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().default('gritcore-uploads'),
});

const _config = envSchema.safeParse(process.env);

if (!_config.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_config.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = _config.data;
