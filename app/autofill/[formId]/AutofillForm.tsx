"use client";

import { useState } from "react";
import Link from "next/link";
import { getDictionary, localized, type Locale } from "@/lib/i18n";
import type { FormSchema } from "@/lib/forms";

type Values = Record<string, string>;
type FilledFrom = Record<string, boolean>;

/**
 * Renders any `FormSchema` — nothing here knows which form it is. Adding a
 * template is a change to `lib/forms.ts` alone.
 */
export default function AutofillForm({
  form,
  locale,
}: {
  form: FormSchema;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const [values, setValues] = useState<Values>({});
  const [filledFrom, setFilledFrom] = useState<FilledFrom>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ranOnce, setRanOnce] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function updateValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFilledFrom((prev) => ({ ...prev, [key]: false }));
  }

  async function handleAutofill() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/autofill/${form.id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? dict.autofill.failed);
        return;
      }
      const newValues: Values = { ...values };
      const newFilledFrom: FilledFrom = {};
      for (const field of form.fields) {
        const entry = data.fillPlan?.[field.key];
        if (entry?.value) {
          newValues[field.key] = entry.value;
          newFilledFrom[field.key] = true;
        }
      }
      setValues(newValues);
      setFilledFrom(newFilledFrom);
      setRanOnce(true);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setValues({});
    setFilledFrom({});
    setRanOnce(false);
    setSubmitted(false);
    setError(null);
  }

  const filledFromWalletCount = Object.values(filledFrom).filter(Boolean).length;
  const totalFields = form.fields.length;

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center space-y-4">
        <div className="text-4xl">✅</div>
        <h2 className="text-lg font-semibold text-neutral-900">
          {dict.autofill.submittedTitle}
        </h2>
        <p className="text-sm text-neutral-500">
          {dict.autofill.submittedBody(filledFromWalletCount, totalFields)}
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={handleReset}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {dict.autofill.startOver}
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700"
          >
            {dict.autofill.backToWallet}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={handleAutofill}
          disabled={loading}
          className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? dict.autofill.buttonLoading : dict.autofill.button}
        </button>
        {ranOnce && (
          <button
            onClick={handleReset}
            className="text-sm text-neutral-500 hover:text-neutral-800"
          >
            {dict.autofill.clearForm}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        {form.fields.map((field) => (
          <div key={field.key}>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-1">
              {localized(field.label, locale)}
              {filledFrom[field.key] && (
                <span className="text-xs font-normal text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                  {dict.autofill.fromWalletBadge}
                </span>
              )}
            </label>
            <input
              value={values[field.key] ?? ""}
              onChange={(e) => updateValue(field.key, e.target.value)}
              placeholder={
                field.fillableFromWallet
                  ? dict.autofill.notYetFilled
                  : dict.autofill.enterManually
              }
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        ))}
      </div>

      {ranOnce && (
        <button
          onClick={() => setSubmitted(true)}
          className="w-full rounded-lg bg-neutral-900 text-white py-2 text-sm font-medium hover:bg-neutral-800"
        >
          {dict.autofill.submit}
        </button>
      )}
    </div>
  );
}
