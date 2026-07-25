"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ShareRow {
  id: string;
  share_token: string;
  shared_with_label: string;
  expires_at: string;
  revoked: number;
  created_at: string;
}

interface AuditRow {
  id: string;
  action: string;
  actor_label: string;
  occurred_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  uploaded: "Uploaded",
  viewed: "Viewed",
  shared: "Share link created",
  revoked: "Share revoked",
  autofill_used: "Used for auto-fill",
};

const EXPIRY_OPTIONS = [
  { label: "1 hour", hours: 1 },
  { label: "24 hours", hours: 24 },
  { label: "7 days", hours: 24 * 7 },
];

export default function ShareManager({
  documentId,
  shares,
  auditLog,
}: {
  documentId: string;
  shares: ShareRow[];
  auditLog: AuditRow[];
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLink, setNewLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setNewLink(null);
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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create share link");
        return;
      }
      const link = `${window.location.origin}/verify/${data.share.shareToken}`;
      setNewLink(link);
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

  function shareStatus(share: ShareRow): { label: string; className: string } {
    if (share.revoked) {
      return { label: "Revoked", className: "text-neutral-400" };
    }
    if (new Date(share.expires_at).getTime() < Date.now()) {
      return { label: "Expired", className: "text-neutral-400" };
    }
    return { label: "Active", className: "text-emerald-600" };
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCreate}
        className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4"
      >
        <h2 className="font-medium text-neutral-900">Create a share link</h2>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Who is this for?
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Landlord — Kilimani flat"
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Valid for
          </label>
          <select
            value={expiresInHours}
            onChange={(e) => setExpiresInHours(Number(e.target.value))}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {EXPIRY_OPTIONS.map((opt) => (
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
          {loading ? "Creating..." : "Generate share link"}
        </button>

        {newLink && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between gap-3">
            <code className="text-xs text-emerald-900 break-all">
              {newLink}
            </code>
            <button
              type="button"
              onClick={() => copyLink(newLink)}
              className="text-xs font-medium text-emerald-700 shrink-0"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </form>

      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="font-medium text-neutral-900 mb-4">Share links</h2>
        {shares.length === 0 ? (
          <p className="text-sm text-neutral-500">No share links yet.</p>
        ) : (
          <ul className="space-y-3">
            {shares.map((share) => {
              const status = shareStatus(share);
              const active = status.label === "Active";
              return (
                <li
                  key={share.id}
                  className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {share.shared_with_label}
                    </p>
                    <p className="text-xs text-neutral-500">
                      <span className={status.className}>{status.label}</span>
                      {" · expires "}
                      {new Date(share.expires_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {active && (
                      <button
                        onClick={() => copyLink(shareLink(share.share_token))}
                        className="text-xs font-medium text-emerald-700"
                      >
                        Copy link
                      </button>
                    )}
                    {active && (
                      <button
                        onClick={() => handleRevoke(share.id)}
                        className="text-xs font-medium text-red-600"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="font-medium text-neutral-900 mb-4">
          Audit trail — who accessed this document
        </h2>
        {auditLog.length === 0 ? (
          <p className="text-sm text-neutral-500">No activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {auditLog.map((entry) => (
              <li
                key={entry.id}
                className="text-sm flex items-center justify-between"
              >
                <span className="text-neutral-900">
                  {ACTION_LABELS[entry.action] ?? entry.action} —{" "}
                  <span className="text-neutral-500">{entry.actor_label}</span>
                </span>
                <span className="text-xs text-neutral-400">
                  {new Date(entry.occurred_at + "Z").toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
