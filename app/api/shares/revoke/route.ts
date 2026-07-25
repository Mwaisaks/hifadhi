import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const revokeSchema = z.object({ shareId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = revokeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const row = db
    .prepare(
      `SELECT shares.id as share_id, shares.document_id as document_id, documents.user_id as owner_id
       FROM shares
       JOIN documents ON documents.id = shares.document_id
       WHERE shares.id = ?`
    )
    .get(parsed.data.shareId) as
    | { share_id: string; document_id: string; owner_id: string }
    | undefined;

  if (!row || row.owner_id !== user.id) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  db.prepare("UPDATE shares SET revoked = 1 WHERE id = ?").run(row.share_id);

  logAudit({
    documentId: row.document_id,
    shareId: row.share_id,
    action: "revoked",
    actorLabel: "owner",
  });

  return NextResponse.json({ ok: true });
}
