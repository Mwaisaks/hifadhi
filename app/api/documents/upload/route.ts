import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { encryptBuffer } from "@/lib/crypto";
import { documentBlobPathname, uploadDocumentBlob } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

const VALID_DOC_TYPES = [
  "national_id",
  "kra_pin",
  "passport",
  "certificate",
  "other",
] as const;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const docTypeRaw = formData.get("docType");
  const docType = VALID_DOC_TYPES.includes(docTypeRaw as never)
    ? (docTypeRaw as (typeof VALID_DOC_TYPES)[number])
    : "other";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const plaintext = Buffer.from(arrayBuffer);
  const { ciphertext, iv, authTag } = encryptBuffer(plaintext);

  const documentId = nanoid();
  const pathname = documentBlobPathname(user.id, documentId);
  const storedPathname = await uploadDocumentBlob(pathname, ciphertext);

  await sql`
    INSERT INTO documents (id, user_id, doc_type, original_filename, mime_type, file_path, iv, auth_tag)
    VALUES (${documentId}, ${user.id}, ${docType}, ${file.name}, ${file.type || "application/octet-stream"}, ${storedPathname}, ${iv}, ${authTag})
  `;

  await logAudit({ documentId, action: "uploaded", actorLabel: "owner" });

  const rows = await sql`
    SELECT id, doc_type, original_filename, uploaded_at, extracted_fields, expires_at
    FROM documents WHERE id = ${documentId}
  `;

  return NextResponse.json({ document: rows[0] });
}
