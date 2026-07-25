import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <p className="text-sm font-medium text-emerald-700 mb-3 tracking-wide uppercase">
            Hifadhi · Safekeeping
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-neutral-900 mb-6 tracking-tight">
            Scan your documents once.
            <br />
            Never queue at a cyber café again.
          </h1>
          <p className="text-lg text-neutral-600 mb-10">
            Upload your ID, KRA PIN, or certificates once. Hifadhi encrypts
            and stores them, then lets you share a specific document with a
            specific person — with a full audit trail of who saw what, and
            when.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-emerald-600 text-white px-6 py-3 text-sm font-medium hover:bg-emerald-700"
            >
              Create your wallet
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Log in
            </Link>
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-xs text-neutral-400">
        No biometrics collected. Consent-scoped sharing. Every access logged.
      </footer>
    </div>
  );
}
