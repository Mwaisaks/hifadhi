import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

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
  if (share.revoked) {
    return NextResponse.json({ valid: false, reason: "revoked" });
  }
  if (new Date(share.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }
  return NextResponse.json({ valid: true });
}
