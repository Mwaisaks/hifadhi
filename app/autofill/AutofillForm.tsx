"use client";

import { useState } from "react";
import { BUSINESS_PERMIT_FORM } from "@/lib/forms";

type Values = Record<string, string>;
type FilledFrom = Record<string, boolean>;

export default function AutofillForm() {
  const [values, setValues] = useState<Values>({});
  const [filledFrom, setFilledFrom] = useState<FilledFrom>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ranOnce, setRanOnce] = useState(false);

  function updateValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFilledFrom((prev) => ({ ...prev, [key]: false }));
  }

  async function handleAutofill() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/autofill/${BUSINESS_PERMIT_FORM.id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Auto-fill failed");
        return;
      }
      const newValues: Values = { ...values };
      const newFilledFrom: FilledFrom = {};
      for (const field of BUSINESS_PERMIT_FORM.fields) {
        const entry = data.fillPlan[field.key];
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
    setError(null);
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={handleAutofill}
          disabled={loading}
          className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Filling from your wallet..." : "Auto-fill from Hifadhi"}
        </button>
        {ranOnce && (
          <button
            onClick={handleReset}
            className="text-sm text-neutral-500 hover:text-neutral-800"
          >
            Clear form
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        {BUSINESS_PERMIT_FORM.fields.map((field) => (
          <div key={field.key}>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-1">
              {field.label}
              {filledFrom[field.key] && (
                <span className="text-xs font-normal text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                  from your wallet
                </span>
              )}
            </label>
            <input
              value={values[field.key] ?? ""}
              onChange={(e) => updateValue(field.key, e.target.value)}
              placeholder={
                field.fillableFromWallet
                  ? "Not yet filled"
                  : "Enter manually — not stored in your wallet"
              }
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
