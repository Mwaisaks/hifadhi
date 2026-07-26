"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { setLocale } from "@/lib/locale-actions";

/**
 * Language switcher.
 *
 * The locale lives in a cookie rather than a `/[lang]` route segment: it's a
 * display preference, not worth restructuring every route for, and share links
 * must stay language-agnostic — a landlord opening `/verify/[token]` shouldn't
 * inherit the sender's UI language from the URL.
 */
export default function LocaleToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function selectLocale(next: Locale) {
    if (next === locale || isPending) return;
    startTransition(async () => {
      await setLocale(next);
      // The action's `revalidatePath` should already re-render the tree; the
      // explicit refresh is cheap insurance so a stuck language switch can
      // never be the thing that derails a live demo.
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={LOCALE_LABELS[locale]}
      className={`inline-flex rounded-lg border border-neutral-300 bg-white p-0.5 text-xs font-medium ${
        isPending ? "opacity-60" : ""
      }`}
    >
      {LOCALES.map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            onClick={() => selectLocale(option)}
            aria-pressed={active}
            className={`rounded-md px-2 py-1 transition-colors ${
              active
                ? "bg-neutral-900 text-white"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {option === "en" ? "EN" : "SW"}
            <span className="sr-only"> — {LOCALE_LABELS[option]}</span>
          </button>
        );
      })}
    </div>
  );
}
