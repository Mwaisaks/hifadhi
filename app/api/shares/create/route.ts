import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const createSchema = z.object({
  documentId: z.string().min(1),
  sharedWithLabel: z.string().min(1).max(200),
  expiresInHours: z.number().min(1).max(24 * 30).default(24),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { documentId, sharedWithLabel, expiresInHours } = parsed.data;

  const docRows = (await sql`
    SELECT id, user_id FROM documents WHERE id = ${documentId}
  `) as { id: string; user_id: string }[];
  const doc = docRows[0];

  if (!doc || doc.user_id !== user.id) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const shareId = nanoid();
  const shareToken = nanoid(24);
  const expiresAt = new Date(
    Date.now() + expiresInHours * 60 * 60 * 1000
  ).toISOString();

  await sql`
    INSERT INTO shares (id, document_id, share_token, shared_with_label, permissions, expires_at)
    VALUES (${shareId}, ${documentId}, ${shareToken}, ${sharedWithLabel}, 'view_only', ${expiresAt})
  `;

  await logAudit({ documentId, shareId, action: "shared", actorLabel: "owner" });

  return NextResponse.json({
    share: {
      id: shareId,
      shareToken,
      sharedWithLabel,
      expiresAt,
    },
  });
}
