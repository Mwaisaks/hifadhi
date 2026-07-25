import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { normalizeExpiryForStorage } from "@/lib/expiry";

const confirmSchema = z.object({
  doc_type: z
    .enum(["national_id", "kra_pin", "passport", "certificate", "other"])
    .nullable()
    .optional(),
  full_name: z.string().nullable(),
  id_number: z.string().nullable(),
  dob: z.string().nullable(),
  issue_date: z.string().nullable(),
  expiry_date: z.string().nullable(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: documentId } = await params;

  const doc = db
    .prepare("SELECT id, user_id, doc_type FROM documents WHERE id = ?")
    .get(documentId) as { id: string; user_id: string; doc_type: string } | undefined;

  if (!doc || doc.user_id !== user.id) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { doc_type, confidence, ...fields } = parsed.data;
  const expiresAt = normalizeExpiryForStorage(fields.expiry_date);

  // `pending_extraction` is the unconfirmed intake guess; once the citizen has
  // reviewed and saved, `extracted_fields` is the record of truth and the guess
  // is dropped so a later re-run can't resurrect uncorrected values.
  db.prepare(
    `UPDATE documents
     SET doc_type = ?, extracted_fields = ?, extraction_confidence = ?, expires_at = ?,
         pending_extraction = NULL
     WHERE id = ?`
  ).run(
    doc_type ?? doc.doc_type,
    JSON.stringify(fields),
    confidence ?? null,
    expiresAt,
    documentId
  );

  const updated = db
    .prepare(
      `SELECT id, doc_type, original_filename, extracted_fields, extraction_confidence, uploaded_at, expires_at
       FROM documents WHERE id = ?`
    )
    .get(documentId);

  return NextResponse.json({ document: updated });
}
