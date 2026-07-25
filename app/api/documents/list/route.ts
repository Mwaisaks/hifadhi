import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const documents = db
    .prepare(
      `SELECT id, doc_type, original_filename, extracted_fields, extraction_confidence,
              uploaded_at, expires_at
       FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC`
    )
    .all(user.id);

  return NextResponse.json({ documents });
}
