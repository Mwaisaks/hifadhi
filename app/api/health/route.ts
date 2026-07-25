import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { pingClaude } from "@/lib/claude";

export async function GET() {
  await sql`INSERT INTO health_check DEFAULT VALUES`;
  const rows = (await sql`SELECT COUNT(*) as count FROM health_check`) as {
    count: string;
  }[];
  const count = Number(rows[0].count);

  let claudeReply: string;
  try {
    claudeReply = await pingClaude();
  } catch (err) {
    return NextResponse.json(
      {
        db: "ok",
        healthCheckRows: count,
        claude: "error",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    db: "ok",
    healthCheckRows: count,
    claude: claudeReply,
  });
}
