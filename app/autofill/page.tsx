import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getLocaleAndDictionary } from "@/lib/i18n-server";
import { localized } from "@/lib/i18n";
import { FORM_LIST, walletFillableCount } from "@/lib/forms";
import LocaleToggle from "@/components/LocaleToggle";

export default async function AutofillPickerPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { locale, dict } = await getLocaleAndDictionary();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm text-neutral-500 hover:text-neutral-800"
          >
            {dict.nav.backToWallet}
          </Link>
          <LocaleToggle locale={locale} />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
          {dict.autofill.pickerTitle}
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          {dict.autofill.pickerSubtitle}
        </p>

        <ul className="space-y-4">
          {FORM_LIST.map((form) => (
            <li
              key={form.id}
              className="bg-white rounded-xl border border-neutral-200 p-6"
            >
              <p className="text-xs uppercase tracking-wide text-neutral-400">
                {localized(form.issuer, locale)}
              </p>
              <h2 className="font-medium text-neutral-900 mt-1">
                {localized(form.title, locale)}
              </h2>
              <p className="text-sm text-neutral-500 mt-2">
                {localized(form.description, locale)}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                <p className="text-xs text-neutral-500">
                  {dict.autofill.fieldsCount(form.fields.length)} ·{" "}
                  <span className="text-emerald-700 font-medium">
                    {dict.autofill.fromWalletCount(walletFillableCount(form))}
                  </span>
                </p>
                <Link
                  href={`/autofill/${form.id}`}
                  className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700"
                >
                  {dict.autofill.openForm}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
