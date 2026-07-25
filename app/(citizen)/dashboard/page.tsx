import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocaleAndDictionary } from "@/lib/i18n-server";
import { docTypeLabel } from "@/lib/i18n";
import { expiryInfo, needsRenewal } from "@/lib/expiry";
import LocaleToggle from "@/components/LocaleToggle";
import LogoutButton from "./LogoutButton";
import RenewalAlerts, { type RenewalItem } from "./RenewalAlerts";

interface DocumentRow {
  id: string;
  doc_type: string;
  original_filename: string | null;
  extracted_fields: string | null;
  extraction_confidence: number | null;
  uploaded_at: string;
  expires_at: string | null;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { locale, dict } = await getLocaleAndDictionary();

  const documents = db
    .prepare(
      `SELECT id, doc_type, original_filename, extracted_fields, extraction_confidence,
              uploaded_at, expires_at
       FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC`
    )
    .all(user.id) as DocumentRow[];

  const rows = documents.map((doc) => {
    const fields = doc.extracted_fields ? JSON.parse(doc.extracted_fields) : null;
    return { doc, fields, expiry: expiryInfo(doc.expires_at) };
  });

  // Soonest-expiring first, so the most urgent renewal leads the alert.
  const renewals: RenewalItem[] = rows
    .flatMap((row) =>
      row.expiry && needsRenewal(row.expiry)
        ? [
            {
              documentId: row.doc.id,
              docType: row.doc.doc_type,
              holderName: row.fields?.full_name ?? null,
              expiry: row.expiry,
            },
          ]
        : []
    )
    .sort((a, b) => a.expiry.daysRemaining - b.expiry.daysRemaining);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-neutral-900">Hifadhi</p>
            <p className="text-sm text-neutral-500">
              {dict.dashboard.welcome(user.name)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <LocaleToggle locale={locale} />
            <Link
              href="/autofill"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              {dict.nav.autofillDemo}
            </Link>
            <Link
              href="/upload"
              className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700"
            >
              {dict.nav.uploadDocument}
            </Link>
            <LogoutButton label={dict.nav.logout} />
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-xl font-semibold text-neutral-900 mb-6">
          {dict.dashboard.yourWallet}
        </h1>

        <RenewalAlerts items={renewals} dict={dict} />

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
            {dict.dashboard.emptyState}{" "}
            <Link href="/upload" className="text-emerald-700 font-medium">
              {dict.dashboard.uploadFirst}
            </Link>
            .
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map(({ doc, fields, expiry }) => (
              <li
                key={doc.id}
                className="bg-white rounded-xl border border-neutral-200 p-5 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-neutral-900 flex items-center gap-2">
                    {docTypeLabel(doc.doc_type, dict)}
                    {fields?.full_name ? ` — ${fields.full_name}` : ""}
                    {expiry?.level === "expired" && (
                      <span className="text-xs font-normal border rounded-full px-2 py-0.5 text-red-600 bg-red-50 border-red-200">
                        {dict.expiry.expired}
                      </span>
                    )}
                    {expiry?.level === "renew_soon" && (
                      <span className="text-xs font-normal border rounded-full px-2 py-0.5 text-amber-600 bg-amber-50 border-amber-200">
                        {dict.expiry.renewSoon}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {doc.original_filename ?? dict.dashboard.document} ·{" "}
                    {dict.dashboard.uploadedAt(
                      new Date(doc.uploaded_at + "Z").toLocaleString(locale)
                    )}
                  </p>
                  {!fields && (
                    <p className="text-xs text-amber-600 mt-1">
                      {dict.dashboard.extractionPending}{" "}
                      <Link
                        href={`/documents/${doc.id}/confirm`}
                        className="underline"
                      >
                        {dict.dashboard.confirmFields}
                      </Link>
                    </p>
                  )}
                </div>
                <Link
                  href={`/documents/${doc.id}/share`}
                  className="text-sm font-medium text-emerald-700 hover:underline"
                >
                  {dict.dashboard.share}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
