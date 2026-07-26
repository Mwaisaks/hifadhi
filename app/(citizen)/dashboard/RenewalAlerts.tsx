import Link from "next/link";
import { docTypeLabel, type Dictionary } from "@/lib/i18n";
import type { ExpiryInfo } from "@/lib/expiry";

export interface RenewalItem {
  documentId: string;
  docType: string;
  holderName: string | null;
  expiry: ExpiryInfo;
}

function timingText(expiry: ExpiryInfo, dict: Dictionary): string {
  if (expiry.level === "expired") {
    return dict.renewals.expiredAgo(Math.abs(expiry.daysRemaining));
  }
  if (expiry.daysRemaining === 0) {
    return dict.renewals.expiresToday;
  }
  return dict.renewals.expiresIn(expiry.daysRemaining);
}

/**
 * Proactive renewal alert — the in-app half of "document expiry notifications".
 *
 * Deliberately not an email: there is no mail infrastructure in this build, and
 * a banner the citizen meets the moment they open their wallet is the honest
 * version of the feature rather than a half-wired SMTP call. It surfaces the
 * same `expires_at` data as the per-row badge, but aggregated and with a next
 * action attached, so a lapsed ID is something you're told about rather than
 * something you have to notice.
 */
export default function RenewalAlerts({
  items,
  dict,
}: {
  items: RenewalItem[];
  dict: Dictionary;
}) {
  if (items.length === 0) return null;

  const hasExpired = items.some((item) => item.expiry.level === "expired");

  return (
    <section
      aria-live="polite"
      className={`mb-8 rounded-xl border p-5 ${
        hasExpired
          ? "border-red-200 bg-red-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="text-lg leading-6">
          {hasExpired ? "⚠️" : "🔔"}
        </span>
        <div className="flex-1">
          <h2
            className={`font-medium ${
              hasExpired ? "text-red-900" : "text-amber-900"
            }`}
          >
            {dict.renewals.heading(items.length)}
          </h2>
          <p
            className={`text-sm mt-1 ${
              hasExpired ? "text-red-700" : "text-amber-700"
            }`}
          >
            {dict.renewals.intro}
          </p>

          <ul className="mt-4 space-y-2">
            {items.map((item) => {
              const expired = item.expiry.level === "expired";
              return (
                <li
                  key={item.documentId}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-white/70 px-3 py-2"
                >
                  <span className="text-sm text-neutral-900">
                    {docTypeLabel(item.docType, dict)}
                    {item.holderName ? ` — ${item.holderName}` : ""}
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium ${
                        expired ? "text-red-700" : "text-amber-700"
                      }`}
                    >
                      {timingText(item.expiry, dict)}
                    </span>
                    <Link
                      href="/upload"
                      className="text-xs font-medium text-emerald-700 hover:underline"
                    >
                      {dict.nav.uploadDocument}
                    </Link>
                  </span>
                </li>
              );
            })}
          </ul>

          <p
            className={`text-xs mt-3 ${
              hasExpired ? "text-red-600" : "text-amber-600"
            }`}
          >
            {dict.renewals.dismissNote}
          </p>
        </div>
      </div>
    </section>
  );
}
