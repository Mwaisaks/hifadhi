import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import fs from "fs/promises";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { encryptBuffer } from "@/lib/crypto";
import { relativeDocumentPath, absoluteDocumentPath, userStorageDir } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { DOC_TYPES, analyzeDocument, type DocumentAnalysis } from "@/lib/extraction";
import { checkIntake } from "@/lib/intake";

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
  const docType = DOC_TYPES.includes(docTypeRaw as never)
    ? (docTypeRaw as (typeof DOC_TYPES)[number])
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
  const mimeType = file.type || "application/octet-stream";

  // Intake check runs BEFORE anything is encrypted or written, so a rejected
  // file never reaches the wallet or the disk at all — there is nothing to
  // clean up and no half-created row to explain.
  let analysis: DocumentAnalysis | null = null;
  try {
    analysis = await analyzeDocument(plaintext.toString("base64"), mimeType);
  } catch {
    // Claude unreachable or malformed response. Deliberately *not* fatal:
    // "we think this is the wrong document" and "we couldn't look at it" are
    // different answers, and a network blip must not lock a citizen out of
    // storing their own ID. The confirm screen still asks them to check every
    // field by hand, so nothing is trusted blindly either way.
    analysis = null;
  }

  if (analysis) {
    const verdict = checkIntake(docType, analysis);
    if (!verdict.ok) {
      return NextResponse.json(
        {
          error: "Document rejected at intake",
          rejection: verdict,
        },
        { status: 422 }
      );
    }
  }

  const { ciphertext, iv, authTag } = encryptBuffer(plaintext);

  const documentId = nanoid();
  userStorageDir(user.id);
  const relPath = relativeDocumentPath(user.id, documentId);
  await fs.writeFile(absoluteDocumentPath(relPath), ciphertext);

  db.prepare(
    `INSERT INTO documents (id, user_id, doc_type, original_filename, mime_type, file_path, iv, auth_tag, pending_extraction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    documentId,
    user.id,
    docType,
    file.name,
    mimeType,
    relPath,
    iv,
    authTag,
    analysis ? JSON.stringify(analysis.fields) : null
  );

  logAudit({ documentId, action: "uploaded", actorLabel: "owner" });

  const row = db
    .prepare(
      `SELECT id, doc_type, original_filename, uploaded_at, extracted_fields, expires_at
       FROM documents WHERE id = ?`
    )
    .get(documentId);

  return NextResponse.json({ document: row });
}
