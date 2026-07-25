import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const STORAGE_DIR = path.join(process.cwd(), "storage");
const DB_PATH = path.join(STORAGE_DIR, "hifadhi.db");

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

declare global {
  // eslint-disable-next-line no-var
  var __hifadhiDb: Database.Database | undefined;
}

function createConnection() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      doc_type TEXT NOT NULL DEFAULT 'other',
      original_filename TEXT,
      mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
      file_path TEXT NOT NULL,
      iv TEXT NOT NULL,
      auth_tag TEXT NOT NULL,
      extracted_fields TEXT,
      extraction_confidence REAL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id),
      share_token TEXT UNIQUE NOT NULL,
      shared_with_label TEXT NOT NULL,
      permissions TEXT NOT NULL DEFAULT 'view_only',
      expires_at TEXT NOT NULL,
      revoked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id),
      share_id TEXT REFERENCES shares(id),
      action TEXT NOT NULL,
      actor_label TEXT NOT NULL,
      occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
    CREATE INDEX IF NOT EXISTS idx_shares_document_id ON shares(document_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_document_id ON audit_log(document_id);
  `);

  const documentColumns = db
    .prepare("PRAGMA table_info(documents)")
    .all() as { name: string }[];
  if (!documentColumns.some((c) => c.name === "mime_type")) {
    db.exec(
      "ALTER TABLE documents ADD COLUMN mime_type TEXT NOT NULL DEFAULT 'application/octet-stream'"
    );
  }

  return db;
}

export const db = globalThis.__hifadhiDb ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  globalThis.__hifadhiDb = db;
}
