import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const share = db
    .prepare(`SELECT expires_at, revoked FROM shares WHERE share_token = ?`)
    .get(token) as { expires_at: string; revoked: number } | undefined;

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
