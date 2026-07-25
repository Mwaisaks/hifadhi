"use client";

import { useEffect, useState } from "react";
import { getDictionary, type Locale } from "@/lib/i18n";

const POLL_INTERVAL_MS = 3000;

export default function VerifyGuard({
  token,
  locale,
  children,
}: {
  token: string;
  locale: Locale;
  children: React.ReactNode;
}) {
  const dict = getDictionary(locale);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/shares/status/${token}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data.valid) {
          setInvalidReason(data.reason ?? "revoked");
        }
      } catch {
        // network hiccup — try again next tick
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  if (invalidReason) {
    const messages: Record<string, { title: string; body: string }> = {
      revoked: {
        title: dict.verify.revokedTitle,
        body: dict.verify.justRevokedBody,
      },
      expired: {
        title: dict.verify.expiredTitle,
        body: dict.verify.expiredBody,
      },
      not_found: {
        title: dict.verify.invalidTitle,
        body: dict.verify.invalidBody,
      },
    };
    const message = messages[invalidReason] ?? messages.revoked;

    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-sm text-center">
          <p className="text-sm font-medium text-emerald-700 mb-2 tracking-wide uppercase">
            Hifadhi
          </p>
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">
            {message.title}
          </h1>
          <p className="text-sm text-neutral-500">{message.body}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
