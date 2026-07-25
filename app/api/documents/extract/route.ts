import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { decryptBuffer } from "@/lib/crypto";
import { absoluteDocumentPath } from "@/lib/storage";
import { extractDocumentFields, extractedFieldsSchema } from "@/lib/extraction";

const bodySchema = z.object({ documentId: z.string().min(1) });

interface DocumentRow {
  id: string;
  user_id: string;
  file_path: string;
  iv: string;
  auth_tag: string;
  mime_type: string;
  pending_extraction: string | null;
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

  const doc = db
    .prepare(
      `SELECT id, user_id, file_path, iv, auth_tag, mime_type, pending_extraction
       FROM documents WHERE id = ?`
    )
    .get(parsed.data.documentId) as DocumentRow | undefined;

  if (!doc || doc.user_id !== user.id) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // The intake check already read this file with Claude vision. Reuse that
  // result rather than paying for — and waiting on — a second identical call.
  if (doc.pending_extraction) {
    try {
      return NextResponse.json({
        fields: extractedFieldsSchema.parse(JSON.parse(doc.pending_extraction)),
      });
    } catch {
      // Unreadable cache is not worth failing over; fall through to a live call.
    }
  }

  const ciphertext = await fs.readFile(absoluteDocumentPath(doc.file_path));
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
