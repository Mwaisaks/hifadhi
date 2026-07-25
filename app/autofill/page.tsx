import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { BUSINESS_PERMIT_FORM } from "@/lib/forms";
import AutofillForm from "./AutofillForm";

export default async function AutofillPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <Link
            href="/dashboard"
            className="text-sm text-neutral-500 hover:text-neutral-800"
          >
            ← Back to wallet
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
          {BUSINESS_PERMIT_FORM.title}
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          {BUSINESS_PERMIT_FORM.description}
        </p>
        <AutofillForm />
      </main>
    </div>
  );
}
