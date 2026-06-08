import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './client.js';

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');

    const sql = readFileSync(
      join(__dirname, '../../migrations/001_init.sql'),
      'utf-8'
    );

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('Migrations complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
