import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

async function initDatabase() {
  const migrationPath = path.resolve(__dirname, '../../migrations/001_initial.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  await pool.query(sql);
}

export { pool, query, initDatabase };
