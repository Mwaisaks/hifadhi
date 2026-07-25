"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DOC_TYPES = [
  { value: "national_id", label: "National ID" },
  { value: "kra_pin", label: "KRA PIN Certificate" },
  { value: "passport", label: "Passport" },
  { value: "certificate", label: "Certificate" },
  { value: "other", label: "Other" },
];

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState(DOC_TYPES[0].value);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file or photo to upload");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("docType", docType);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      router.push(`/documents/${data.document.id}/confirm`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-800">
            ← Back to wallet
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
          Upload a document
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          Scan or photograph it once. Hifadhi encrypts it and, next, extracts
          the fields for you to confirm.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-neutral-200 p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Document type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              File or photo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              className="w-full text-sm text-neutral-600 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-700"
            />
            {fileName && (
              <p className="text-xs text-neutral-500 mt-2">Selected: {fileName}</p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Encrypting & uploading..." : "Upload document"}
          </button>
        </form>
      </main>
    </div>
  );
}
