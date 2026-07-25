import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const documents = await sql`
    SELECT id, doc_type, original_filename, extracted_fields, extraction_confidence,
           uploaded_at, expires_at
    FROM documents WHERE user_id = ${user.id} ORDER BY uploaded_at DESC
  `;

  return NextResponse.json({ documents });
}
