import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { INITIAL_TEAM_NOTES } from './constants';
import { DynamicRule, ShareSnapshot } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const LIVENSA_DB_PATH = path.join(DATA_DIR, 'livensa.db');
const APP_STATE_DB_PATH = path.join(DATA_DIR, 'app_state.db');

let livensaDb: DatabaseSync | null = null;
let appStateDb: DatabaseSync | null = null;

export function getLivensaDb(): DatabaseSync {
  if (!livensaDb) {
    if (!fs.existsSync(LIVENSA_DB_PATH)) {
      throw new Error(`Livensa database not found at ${LIVENSA_DB_PATH}`);
    }
    // Read-only access to warehouse database as requested by security specs
    livensaDb = new DatabaseSync(LIVENSA_DB_PATH, { readOnly: true });
  }
  return livensaDb;
}

export function getAppStateDb(): DatabaseSync {
  if (!appStateDb) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    appStateDb = new DatabaseSync(APP_STATE_DB_PATH);
    initAppStateDb(appStateDb);
  }
  return appStateDb;
}

function initAppStateDb(db: DatabaseSync) {
  // Table for user-customizable rules ("Teach the agent")
  db.exec(`
    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Table for shareable snapshots ("Share with teammate")
  db.exec(`
    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      question TEXT,
      answer TEXT,
      steps_json TEXT,
      sql_query TEXT,
      filters_json TEXT,
      data_snapshot_json TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Seed / sync initial team rules (preserves user enabled/disabled toggle if already present)
  const upsertStmt = db.prepare(`
    INSERT INTO rules (id, title, content, category, enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      content = excluded.content,
      category = excluded.category,
      updated_at = excluded.updated_at
  `);
  const now = new Date().toISOString();
  for (const rule of INITIAL_TEAM_NOTES) {
    upsertStmt.run(rule.id, rule.title, rule.content, rule.category, rule.enabled ? 1 : 0, now, now);
  }
}

/**
 * Execute a read-only SQL query on livensa.db with strict safety checks.
 */
export function executeReadOnlyQuery<T = Record<string, unknown>>(query: string, params: (string | number)[] = []): { rows: T[]; executionTimeMs: number } {
  const trimmed = query.trim();

  // Strict read-only validation: allow only SELECT / WITH ... SELECT
  const sanitized = trimmed.replace(/\/\*[\s\S]*?\*\/|--.*$/gm, '').trim();
  const lower = sanitized.toLowerCase();

  const isSelect = lower.startsWith('select') || lower.startsWith('with');
  const hasDangerousKeywords = /\b(insert|update|delete|drop|alter|create|replace|vacuum|pragma|attach|detach)\b/i.test(sanitized);

  if (!isSelect || hasDangerousKeywords) {
    throw new Error('Security policy violation: Only read-only SELECT queries are permitted.');
  }

  const db = getLivensaDb();
  const startTime = performance.now();
  const stmt = db.prepare(trimmed);
  const rows = stmt.all(...params) as T[];
  const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

  return { rows, executionTimeMs };
}

// Rules CRUD
export function getActiveRules(): DynamicRule[] {
  const db = getAppStateDb();
  const rows = db.prepare('SELECT * FROM rules WHERE enabled = 1 ORDER BY id ASC').all() as Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    enabled: number;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map(r => ({
    id: r.id,
    title: r.title,
    content: r.content,
    category: r.category as DynamicRule['category'],
    enabled: Boolean(r.enabled),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function getAllRules(): DynamicRule[] {
  const db = getAppStateDb();
  const rows = db.prepare('SELECT * FROM rules ORDER BY created_at ASC').all() as Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    enabled: number;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map(r => ({
    id: r.id,
    title: r.title,
    content: r.content,
    category: r.category as DynamicRule['category'],
    enabled: Boolean(r.enabled),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function upsertRule(rule: Partial<DynamicRule> & { title: string; content: string }): DynamicRule {
  const db = getAppStateDb();
  const now = new Date().toISOString();
  const id = rule.id || `custom-${Date.now()}`;
  const category = rule.category || 'custom';
  const enabled = rule.enabled !== undefined ? (rule.enabled ? 1 : 0) : 1;

  db.prepare(`
    INSERT INTO rules (id, title, content, category, enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      content = excluded.content,
      category = excluded.category,
      enabled = excluded.enabled,
      updated_at = excluded.updated_at
  `).run(id, rule.title, rule.content, category, enabled, now, now);

  return {
    id,
    title: rule.title,
    content: rule.content,
    category,
    enabled: Boolean(enabled),
    createdAt: now,
    updatedAt: now,
  };
}

export function toggleRule(id: string, enabled: boolean): void {
  const db = getAppStateDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE rules SET enabled = ?, updated_at = ? WHERE id = ?').run(enabled ? 1 : 0, now, id);
}

export function deleteRule(id: string): void {
  const db = getAppStateDb();
  db.prepare('DELETE FROM rules WHERE id = ?').run(id);
}

// Share Snapshots CRUD
export function createShareSnapshot(snapshot: Omit<ShareSnapshot, 'id' | 'createdAt'>): ShareSnapshot {
  const db = getAppStateDb();
  const id = `share-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO shares (id, title, question, answer, steps_json, sql_query, filters_json, data_snapshot_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    snapshot.title,
    snapshot.question || '',
    snapshot.answer || '',
    JSON.stringify(snapshot.steps || []),
    snapshot.sqlQuery || '',
    JSON.stringify(snapshot.filters || {}),
    JSON.stringify(snapshot.metricsSnapshot || {}),
    now
  );

  return {
    id,
    title: snapshot.title,
    question: snapshot.question,
    answer: snapshot.answer,
    steps: snapshot.steps,
    sqlQuery: snapshot.sqlQuery,
    filters: snapshot.filters,
    metricsSnapshot: snapshot.metricsSnapshot,
    createdAt: now,
  };
}

export function getShareSnapshot(id: string): ShareSnapshot | null {
  const db = getAppStateDb();
  const row = db.prepare('SELECT * FROM shares WHERE id = ?').get(id) as {
    id: string;
    title: string;
    question: string;
    answer: string;
    steps_json: string;
    sql_query: string;
    filters_json: string;
    data_snapshot_json: string;
    created_at: string;
  } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    question: row.question,
    answer: row.answer,
    steps: JSON.parse(row.steps_json || '[]'),
    sqlQuery: row.sql_query,
    filters: JSON.parse(row.filters_json || '{}'),
    metricsSnapshot: JSON.parse(row.data_snapshot_json || '{}'),
    createdAt: row.created_at,
  };
}
