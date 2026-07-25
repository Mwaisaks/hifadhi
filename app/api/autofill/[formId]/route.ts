import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getForm } from "@/lib/forms";
import { mapWalletToForm, type WalletDocument } from "@/lib/autofill";
import { logAudit } from "@/lib/audit";

interface DocumentRow {
  id: string;
  doc_type: string;
  extracted_fields: string;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { formId } = await params;
  const form = getForm(formId);
  if (!form) {
    return NextResponse.json({ error: "Unknown form" }, { status: 404 });
  }

  const rows = db
    .prepare(
      `SELECT id, doc_type, extracted_fields FROM documents
       WHERE user_id = ? AND extracted_fields IS NOT NULL`
    )
    .all(user.id) as DocumentRow[];

  const walletDocuments: WalletDocument[] = rows.map((row) => {
    const fields = JSON.parse(row.extracted_fields);
    return {
      document_id: row.id,
      doc_type: row.doc_type,
      full_name: fields.full_name ?? null,
      id_number: fields.id_number ?? null,
      dob: fields.dob ?? null,
      issue_date: fields.issue_date ?? null,
      expiry_date: fields.expiry_date ?? null,
    };
  });

  let fillPlan;
  try {
    fillPlan = await mapWalletToForm(walletDocuments, form);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Auto-fill mapping failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }

  const contributingDocumentIds = new Set(
    Object.values(fillPlan)
      .map((entry) => entry.sourceDocumentId)
      .filter((id): id is string => Boolean(id))
  );

  for (const documentId of contributingDocumentIds) {
    logAudit({ documentId, action: "autofill_used", actorLabel: "owner" });
  }

  return NextResponse.json({ fillPlan });
}
