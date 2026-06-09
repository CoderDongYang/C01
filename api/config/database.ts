import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '../../data/codoc.db');
const MIGRATION_PATH = path.resolve(__dirname, '../../migrations/001_initial.sql');

let db: initSqlJs.Database;

function generateId(): string {
  return uuidv4();
}

async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs();

  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON;');
  db.run('PRAGMA journal_mode = WAL;');

  const migrationSQL = fs.readFileSync(MIGRATION_PATH, 'utf-8');
  const statements = migrationSQL
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    db.run(stmt);
  }

  saveDatabase();
}

function saveDatabase(): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

interface QueryResult {
  rows: Record<string, unknown>[];
  changes: number;
  lastInsertRowid: number;
}

function query(text: string, params?: unknown[]): QueryResult {
  if (text.trim().toUpperCase().startsWith('SELECT')) {
    const stmt = db.prepare(text);
    stmt.bind(params || []);
    const rows: Record<string, unknown>[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return { rows, changes: 0, lastInsertRowid: 0 };
  }

  db.run(text, params);
  saveDatabase();

  return {
    rows: [],
    changes: db.getRowsModified(),
    lastInsertRowid: 0,
  };
}

function queryReturning(text: string, params?: unknown[]): QueryResult {
  if (text.trim().toUpperCase().startsWith('SELECT')) {
    return query(text, params);
  }

  const insertMatch = text.match(/^INSERT\s+INTO\s+(\w+)\s+/i);
  const tableName = insertMatch ? insertMatch[1] : null;

  db.run(text, params);
  saveDatabase();

  if (tableName) {
    const lastRow = query(`SELECT * FROM ${tableName} ORDER BY rowid DESC LIMIT 1`);
    return lastRow;
  }

  return { rows: [], changes: db.getRowsModified(), lastInsertRowid: 0 };
}

export { initDatabase, query, queryReturning, generateId };
