import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { shareState } from "@/lib/expiry";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const rows = (await sql`
    SELECT expires_at, revoked FROM shares WHERE share_token = ${token}
  `) as { expires_at: string; revoked: boolean }[];
  const share = rows[0];

  if (!share) {
    return NextResponse.json({ valid: false, reason: "not_found" });
  }

  // Same helper as `/verify/[token]` renders through, so the live poll can never
  // disagree with the server-rendered decision about whether a link is usable.
  const state = shareState(share);
  if (state !== "active") {
    return NextResponse.json({ valid: false, reason: state });
  }

  return NextResponse.json({ valid: true });
}
