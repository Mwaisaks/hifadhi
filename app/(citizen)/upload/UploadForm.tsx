"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { docTypeLabel, getDictionary, type Locale } from "@/lib/i18n";
import { DOC_TYPES } from "@/lib/extraction";
import type { IntakeVerdict } from "@/lib/intake";
import { safeJson } from "@/lib/http";

/** The `ok: false` shapes are the only ones the API ever sends back. */
type Rejection = Extract<IntakeVerdict, { ok: false }>;

export default function UploadForm({ locale }: { locale: Locale }) {
  // Client components receive the serializable `locale` and look the strings up
  // themselves — the dictionary holds functions, which can't cross the
  // server/client boundary as props.
  const dict = getDictionary(locale);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<string>(DOC_TYPES[0]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejection, setRejection] = useState<Rejection | null>(null);
  const [loading, setLoading] = useState(false);

  function clearFeedback() {
    setError(null);
    setRejection(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearFeedback();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError(dict.upload.chooseFile);
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
      const data = await safeJson(res);
      if (!res.ok) {
        // 422 carries a structured intake verdict; anything else is a plain error.
        if (res.status === 422 && data.rejection) {
          setRejection(data.rejection as Rejection);
        } else {
          setError(data.error ?? dict.upload.uploadFailed);
        }
        return;
      }
      router.push(`/documents/${data.document.id}/confirm`);
    } finally {
      setLoading(false);
    }
  }

  function resetFile() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFileName(null);
    clearFeedback();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-neutral-200 p-8 space-y-6"
    >
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {dict.upload.docTypeLabel}
        </label>
        <select
          value={docType}
          onChange={(e) => {
            setDocType(e.target.value);
            // The previous rejection was about the old label — don't leave a
            // stale complaint on screen once they've changed it.
            clearFeedback();
          }}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {DOC_TYPES.map((value) => (
            <option key={value} value={value}>
              {dict.docTypes[value]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {dict.upload.fileLabel}
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => {
            setFileName(e.target.files?.[0]?.name ?? null);
            clearFeedback();
          }}
          className="w-full text-sm text-neutral-600 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-700"
        />
        {fileName && (
          <p className="text-xs text-neutral-500 mt-2">
            {dict.upload.selected(fileName)}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {rejection && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2"
        >
          <p className="text-sm font-medium text-red-900">
            {dict.upload.rejectedTitle}
          </p>

          {rejection.code === "not_a_document" ? (
            <>
              <p className="text-sm text-red-700">
                {dict.upload.notADocumentBody}
              </p>
              {rejection.summary && (
                <p className="text-xs text-red-600 italic">
                  {dict.upload.notADocumentSaw(rejection.summary)}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-red-700">
                {dict.upload.wrongTypeBody(
                  docTypeLabel(rejection.declared, dict),
                  docTypeLabel(rejection.detected, dict)
                )}
              </p>
              <p className="text-xs text-red-600">
                {dict.upload.wrongTypeFix(
                  docTypeLabel(rejection.declared, dict),
                  docTypeLabel(rejection.detected, dict)
                )}
              </p>
            </>
          )}

          <div className="pt-1">
            <button
              type="button"
              onClick={resetFile}
              className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              {dict.upload.tryAgain}
            </button>
          </div>
          <p className="text-xs text-red-500">{dict.upload.rejectedFootnote}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? dict.upload.checking : dict.upload.submit}
      </button>
    </form>
  );
}
