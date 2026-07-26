import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getLocaleAndDictionary } from "@/lib/i18n-server";
import { localized } from "@/lib/i18n";
import { FORM_LIST, getForm } from "@/lib/forms";
import LocaleToggle from "@/components/LocaleToggle";
import AutofillForm from "./AutofillForm";

export default async function AutofillFormPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { formId } = await params;
  const form = getForm(formId);
  if (!form) {
    notFound();
  }

  const { locale, dict } = await getLocaleAndDictionary();
  const otherForms = FORM_LIST.filter((candidate) => candidate.id !== form.id);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/autofill"
            className="text-sm text-neutral-500 hover:text-neutral-800"
          >
            {dict.nav.backToForms}
          </Link>
          <LocaleToggle locale={locale} />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-xs uppercase tracking-wide text-neutral-400">
          {localized(form.issuer, locale)}
        </p>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1 mt-1">
          {localized(form.title, locale)}
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          {localized(form.description, locale)}
        </p>

        <AutofillForm form={form} locale={locale} />

        {otherForms.length > 0 && (
          <div className="mt-8 text-sm text-neutral-500">
            <span className="font-medium text-neutral-700">
              {dict.autofill.otherForms}:
            </span>{" "}
            {otherForms.map((other, index) => (
              <span key={other.id}>
                {index > 0 && ", "}
                <Link
                  href={`/autofill/${other.id}`}
                  className="text-emerald-700 hover:underline"
                >
                  {localized(other.title, locale)}
                </Link>
              </span>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
