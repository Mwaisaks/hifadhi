"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auditActionLabel, getDictionary, type Locale } from "@/lib/i18n";
import { shareState, type ShareState } from "@/lib/expiry";
import { safeJson } from "@/lib/http";

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

/** SVG served by `/api/shares/[shareId]/qr`, owner-authenticated. */
function ShareQr({
  shareId,
  alt,
  hint,
  caption,
}: {
  shareId: string;
  alt: string;
  hint: string;
  caption: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium text-neutral-700">{caption}</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- dynamic, no-store SVG from an API route; next/image would only add indirection */}
      <img
        src={`/api/shares/${shareId}/qr`}
        alt={alt}
        width={200}
        height={200}
        className="h-[200px] w-[200px]"
      />
      <p className="max-w-[240px] text-center text-xs text-neutral-500">
        {hint}
      </p>
    </div>
  );
}

export default function ShareManager({
  locale,
  documentId,
  shares,
  auditLog,
}: {
  locale: Locale;
  documentId: string;
  shares: ShareRow[];
  auditLog: AuditRow[];
}) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newShare, setNewShare] = useState<{ id: string; link: string } | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [qrShareId, setQrShareId] = useState<string | null>(null);

  const expiryOptions = [
    { label: dict.share.oneHour, hours: 1 },
    { label: dict.share.twentyFourHours, hours: 24 },
    { label: dict.share.sevenDays, hours: 24 * 7 },
  ];

  const statusLabels: Record<ShareState, string> = {
    active: dict.share.statusActive,
    expired: dict.share.statusExpired,
    revoked: dict.share.statusRevoked,
  };

  const statusClasses: Record<ShareState, string> = {
    active: "text-emerald-600",
    expired: "text-neutral-400",
    revoked: "text-neutral-400",
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setNewShare(null);
    try {
      const res = await fetch("/api/shares/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          sharedWithLabel: label,
          expiresInHours,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        setError(data.error ?? dict.share.createFailed);
        return;
      }
      setNewShare({
        id: data.share.id,
        link: `${window.location.origin}/verify/${data.share.shareToken}`,
      });
      setLabel("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(shareId: string) {
    await fetch("/api/shares/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareId }),
    });
    if (qrShareId === shareId) setQrShareId(null);
    if (newShare?.id === shareId) setNewShare(null);
    router.refresh();
  }

  function shareLink(token: string) {
    return `${window.location.origin}/verify/${token}`;
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCreate}
        className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4"
      >
        <h2 className="font-medium text-neutral-900">{dict.share.createTitle}</h2>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {dict.share.whoFor}
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={dict.share.whoForPlaceholder}
            required
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {dict.share.validFor}
          </label>
          <select
            value={expiresInHours}
            onChange={(e) => setExpiresInHours(Number(e.target.value))}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {expiryOptions.map((opt) => (
              <option key={opt.hours} value={opt.hours}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? dict.share.generating : dict.share.generate}
        </button>

        {newShare && (
          <div className="space-y-3">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between gap-3">
              <code className="text-xs text-emerald-900 break-all">
                {newShare.link}
              </code>
              <button
                type="button"
                onClick={() => copyLink(newShare.link)}
                className="text-xs font-medium text-emerald-700 shrink-0"
              >
                {copied ? dict.share.copied : dict.share.copy}
              </button>
            </div>
            <ShareQr
              shareId={newShare.id}
              alt={dict.share.qrAlt}
              hint={dict.share.qrHint}
              caption={dict.share.scanToView}
            />
          </div>
        )}
      </form>

      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="font-medium text-neutral-900 mb-4">
          {dict.share.linksTitle}
        </h2>
        {shares.length === 0 ? (
          <p className="text-sm text-neutral-500">{dict.share.noLinks}</p>
        ) : (
          <ul className="space-y-3">
            {shares.map((share) => {
              const state = shareState(share);
              const active = state === "active";
              const qrOpen = qrShareId === share.id;
              return (
                <li
                  key={share.id}
                  className="border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {share.shared_with_label}
                      </p>
                      <p className="text-xs text-neutral-500">
                        <span className={statusClasses[state]}>
                          {statusLabels[state]}
                        </span>
                        {" · "}
                        {dict.share.expiresOn(
                          new Date(share.expires_at).toLocaleString(locale)
                        )}
                      </p>
                    </div>
                    {active && (
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => copyLink(shareLink(share.share_token))}
                          className="text-xs font-medium text-emerald-700"
                        >
                          {dict.share.copyLink}
                        </button>
                        <button
                          onClick={() =>
                            setQrShareId(qrOpen ? null : share.id)
                          }
                          aria-expanded={qrOpen}
                          className="text-xs font-medium text-emerald-700"
                        >
                          {qrOpen ? dict.share.hideQr : dict.share.showQr}
                        </button>
                        <button
                          onClick={() => handleRevoke(share.id)}
                          className="text-xs font-medium text-red-600"
                        >
                          {dict.share.revoke}
                        </button>
                      </div>
                    )}
                  </div>
                  {active && qrOpen && (
                    <div className="mt-3">
                      <ShareQr
                        shareId={share.id}
                        alt={dict.share.qrAlt}
                        hint={dict.share.qrHint}
                        caption={dict.share.scanToView}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="font-medium text-neutral-900 mb-4">
          {dict.share.auditTitle}
        </h2>
        {auditLog.length === 0 ? (
          <p className="text-sm text-neutral-500">{dict.share.noActivity}</p>
        ) : (
          <ul className="space-y-2">
            {auditLog.map((entry) => (
              <li
                key={entry.id}
                className="text-sm flex items-center justify-between"
              >
                <span className="text-neutral-900">
                  {auditActionLabel(entry.action, dict)} —{" "}
                  <span className="text-neutral-500">{entry.actor_label}</span>
                </span>
                <span className="text-xs text-neutral-400">
                  {new Date(entry.occurred_at).toLocaleString(locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
