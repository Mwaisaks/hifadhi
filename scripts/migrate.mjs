import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(url);

async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
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
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id),
      share_token TEXT UNIQUE NOT NULL,
      shared_with_label TEXT NOT NULL,
      permissions TEXT NOT NULL DEFAULT 'view_only',
      expires_at TIMESTAMPTZ NOT NULL,
      revoked BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id),
      share_id TEXT REFERENCES shares(id),
      action TEXT NOT NULL,
      actor_label TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS health_check (
      id SERIAL PRIMARY KEY,
      checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_shares_document_id ON shares(document_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_document_id ON audit_log(document_id)`;

  console.log("Migration complete.");
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
