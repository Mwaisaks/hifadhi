"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Fields {
  doc_type: string | null;
  full_name: string | null;
  id_number: string | null;
  dob: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  confidence: number | null;
}

const EMPTY_FIELDS: Fields = {
  doc_type: null,
  full_name: null,
  id_number: null,
  dob: null,
  issue_date: null,
  expiry_date: null,
  confidence: null,
};

const FIELD_LABELS: { key: keyof Fields; label: string; type?: string }[] = [
  { key: "full_name", label: "Full name" },
  { key: "id_number", label: "ID / document number" },
  { key: "dob", label: "Date of birth", type: "date" },
  { key: "issue_date", label: "Issue date", type: "date" },
  { key: "expiry_date", label: "Expiry date", type: "date" },
];

export default function ConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractionFailed, setExtractionFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/documents/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId: id }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setExtractionFailed(true);
          setError(
            data.error ??
              "Automatic extraction failed. Enter the details manually below."
          );
        } else {
          setFields({ ...EMPTY_FIELDS, ...data.fields });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function updateField(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value || null }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

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
          Confirm extracted fields
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          Claude read your document. Check the fields below, fix anything
          that&apos;s wrong, then save. Nothing is stored to your wallet
          until you confirm.
        </p>

        {loading ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-neutral-500">
            Extracting fields with Claude…
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl border border-neutral-200 p-8 space-y-4"
          >
            {extractionFailed && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {!extractionFailed && fields.confidence !== null && (
              <p className="text-xs text-neutral-400">
                Claude&apos;s confidence: {Math.round(fields.confidence * 100)}%
              </p>
            )}
            {FIELD_LABELS.map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {label}
                </label>
                <input
                  type={type ?? "text"}
                  value={fields[key] ?? ""}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Not detected"
                />
              </div>
            ))}

            {error && !extractionFailed && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Confirm & save to wallet"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
