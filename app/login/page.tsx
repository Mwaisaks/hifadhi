import { getLocaleAndDictionary } from "@/lib/i18n-server";
import LocaleToggle from "@/components/LocaleToggle";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const { locale, dict } = await getLocaleAndDictionary();

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="text-2xl font-semibold text-neutral-900">
            {dict.auth.loginTitle}
          </h1>
          <LocaleToggle locale={locale} />
        </div>
        <p className="text-sm text-neutral-500 mb-6">
          {dict.auth.loginSubtitle}
        </p>
        <LoginForm locale={locale} />
      </div>
    </div>
  );
}
