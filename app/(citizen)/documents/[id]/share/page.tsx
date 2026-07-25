import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import ShareManager from "./ShareManager";

interface DocumentRow {
  id: string;
  user_id: string;
  doc_type: string;
  original_filename: string | null;
  extracted_fields: string | null;
}

interface ShareRow {
  id: string;
  share_token: string;
  shared_with_label: string;
  expires_at: string;
  revoked: boolean;
  created_at: string;
}

interface AuditRow {
  id: string;
  action: string;
  actor_label: string;
  occurred_at: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  national_id: "National ID",
  kra_pin: "KRA PIN Certificate",
  passport: "Passport",
  certificate: "Certificate",
  other: "Document",
};

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const docRows = (await sql`
    SELECT id, user_id, doc_type, original_filename, extracted_fields
    FROM documents WHERE id = ${id}
  `) as DocumentRow[];
  const doc = docRows[0];

  if (!doc || doc.user_id !== user.id) {
    notFound();
  }

  const shares = (await sql`
    SELECT id, share_token, shared_with_label, expires_at, revoked, created_at
    FROM shares WHERE document_id = ${id} ORDER BY created_at DESC
  `) as ShareRow[];

  const auditLog = (await sql`
    SELECT id, action, actor_label, occurred_at
    FROM audit_log WHERE document_id = ${id} ORDER BY occurred_at DESC
  `) as AuditRow[];

  const fields = doc.extracted_fields ? JSON.parse(doc.extracted_fields) : null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <Link
            href="/dashboard"
            className="text-sm text-neutral-500 hover:text-neutral-800"
          >
            ← Back to wallet
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
          {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
          {fields?.full_name ? ` — ${fields.full_name}` : ""}
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          Share this document with a specific person, for a limited time.
          Every view is logged below.
        </p>

        <ShareManager documentId={doc.id} shares={shares} auditLog={auditLog} />
      </main>
    </div>
  );
}
