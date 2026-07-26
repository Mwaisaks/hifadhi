import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLocaleAndDictionary } from "@/lib/i18n-server";
import LocaleToggle from "@/components/LocaleToggle";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  const { locale, dict } = await getLocaleAndDictionary();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <div className="px-6 pt-6 flex justify-end">
        <LocaleToggle locale={locale} />
      </div>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <p className="text-sm font-medium text-emerald-700 mb-3 tracking-wide uppercase">
            {dict.landing.eyebrow}
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-neutral-900 mb-6 tracking-tight">
            {dict.landing.headlineLine1}
            <br />
            {dict.landing.headlineLine2}
          </h1>
          <p className="text-lg text-neutral-600 mb-10">{dict.landing.body}</p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-emerald-600 text-white px-6 py-3 text-sm font-medium hover:bg-emerald-700"
            >
              {dict.landing.createWallet}
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              {dict.landing.login}
            </Link>
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-xs text-neutral-400">
        {dict.landing.footer}
      </footer>
    </div>
  );
}
