import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLocaleAndDictionary } from "@/lib/i18n-server";
import LocaleToggle from "@/components/LocaleToggle";
import ConfirmForm from "./ConfirmForm";

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
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
          {dict.confirm.title}
        </h1>
        <p className="text-sm text-neutral-500 mb-8">{dict.confirm.subtitle}</p>

        <ConfirmForm documentId={id} locale={locale} />
      </main>
    </div>
  );
}
