import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import LogoutButton from "./LogoutButton";

interface DocumentRow {
  id: string;
  doc_type: string;
  original_filename: string | null;
  extracted_fields: string | null;
  extraction_confidence: number | null;
  uploaded_at: string;
  expires_at: string | null;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  national_id: "National ID",
  kra_pin: "KRA PIN Certificate",
  passport: "Passport",
  certificate: "Certificate",
  other: "Other",
};

const RENEWAL_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function expiryStatus(
  expiresAt: string | null
): { label: string; className: string } | null {
  if (!expiresAt) return null;
  const msUntilExpiry = new Date(expiresAt).getTime() - Date.now();
  if (msUntilExpiry < 0) {
    return { label: "Expired", className: "text-red-600 bg-red-50 border-red-200" };
  }
  if (msUntilExpiry < RENEWAL_WINDOW_MS) {
    return {
      label: "Renew soon",
      className: "text-amber-600 bg-amber-50 border-amber-200",
    };
  }
  return null;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const documents = db
    .prepare(
      `SELECT id, doc_type, original_filename, extracted_fields, extraction_confidence,
              uploaded_at, expires_at
       FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC`
    )
    .all(user.id) as DocumentRow[];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-neutral-900">Hifadhi</p>
            <p className="text-sm text-neutral-500">Welcome, {user.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/autofill"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              Auto-fill demo
            </Link>
            <Link
              href="/upload"
              className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700"
            >
              Upload document
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-xl font-semibold text-neutral-900 mb-6">
          Your wallet
        </h1>
        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
            No documents yet.{" "}
            <Link href="/upload" className="text-emerald-700 font-medium">
              Upload your first one
            </Link>
            .
          </div>
        ) : (
          <ul className="space-y-3">
            {documents.map((doc) => {
              const fields = doc.extracted_fields
                ? JSON.parse(doc.extracted_fields)
                : null;
              const expiry = expiryStatus(doc.expires_at);
              return (
                <li
                  key={doc.id}
                  className="bg-white rounded-xl border border-neutral-200 p-5 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-neutral-900 flex items-center gap-2">
                      {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
                      {fields?.full_name ? ` — ${fields.full_name}` : ""}
                      {expiry && (
                        <span
                          className={`text-xs font-normal border rounded-full px-2 py-0.5 ${expiry.className}`}
                        >
                          {expiry.label}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {doc.original_filename ?? "document"} · uploaded{" "}
                      {new Date(doc.uploaded_at + "Z").toLocaleString()}
                    </p>
                    {!fields && (
                      <p className="text-xs text-amber-600 mt-1">
                        Extraction pending —{" "}
                        <Link
                          href={`/documents/${doc.id}/confirm`}
                          className="underline"
                        >
                          confirm fields
                        </Link>
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/documents/${doc.id}/share`}
                    className="text-sm font-medium text-emerald-700 hover:underline"
                  >
                    Share
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
