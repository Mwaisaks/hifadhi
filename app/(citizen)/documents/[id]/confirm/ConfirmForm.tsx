"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDictionary, type Locale } from "@/lib/i18n";
import { safeJson } from "@/lib/http";

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

const EDITABLE_FIELDS: {
  key: "full_name" | "id_number" | "dob" | "issue_date" | "expiry_date";
  type?: string;
}[] = [
  { key: "full_name" },
  { key: "id_number" },
  { key: "dob", type: "date" },
  { key: "issue_date", type: "date" },
  { key: "expiry_date", type: "date" },
];

export default function ConfirmForm({
  documentId,
  locale,
}: {
  documentId: string;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
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
          body: JSON.stringify({ documentId }),
        });
        const data = await safeJson(res);
        if (cancelled) return;
        if (!res.ok) {
          setExtractionFailed(true);
          setError(data.error ?? dict.confirm.extractionFailed);
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
    // The dictionary is derived from `locale` and only supplies a fallback
    // message; re-running extraction on a language change would be wrong.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  function updateField(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value || null }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        setError(data.error ?? dict.confirm.saveFailed);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-neutral-500">
        {dict.confirm.extracting}
      </div>
    );
  }

  return (
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
          {dict.confirm.confidence(Math.round(fields.confidence * 100))}
        </p>
      )}
      {EDITABLE_FIELDS.map(({ key, type }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {dict.confirm.fields[key]}
          </label>
          <input
            type={type ?? "text"}
            value={fields[key] ?? ""}
            onChange={(e) => updateField(key, e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder={dict.confirm.notDetected}
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
        {saving ? dict.confirm.saving : dict.confirm.save}
      </button>
    </form>
  );
}
