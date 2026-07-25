import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pingClaude } from "@/lib/claude";

export async function GET() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS health_check (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checked_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.prepare("INSERT INTO health_check DEFAULT VALUES").run();
  const row = db
    .prepare("SELECT COUNT(*) as count FROM health_check")
    .get() as { count: number };

  let claudeReply: string;
  try {
    claudeReply = await pingClaude();
  } catch (err) {
    return NextResponse.json(
      {
        db: "ok",
        healthCheckRows: row.count,
        claude: "error",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    db: "ok",
    healthCheckRows: row.count,
    claude: claudeReply,
  });
}
