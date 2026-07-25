import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { decryptBuffer } from "@/lib/crypto";
import { downloadDocumentBlob } from "@/lib/storage";
import { extractDocumentFields } from "@/lib/extraction";

const bodySchema = z.object({ documentId: z.string().min(1) });

interface DocumentRow {
  id: string;
  user_id: string;
  file_path: string;
  iv: string;
  auth_tag: string;
  mime_type: string;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const rows = (await sql`
    SELECT id, user_id, file_path, iv, auth_tag, mime_type FROM documents WHERE id = ${parsed.data.documentId}
  `) as DocumentRow[];
  const doc = rows[0];

  if (!doc || doc.user_id !== user.id) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const ciphertext = await downloadDocumentBlob(doc.file_path);
  const plaintext = decryptBuffer(ciphertext, doc.iv, doc.auth_tag);
  const base64Data = plaintext.toString("base64");

  try {
    const fields = await extractDocumentFields(base64Data, doc.mime_type);
    return NextResponse.json({ fields });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Extraction failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
