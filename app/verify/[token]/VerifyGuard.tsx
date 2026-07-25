"use client";

import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 3000;

const MESSAGES: Record<string, { title: string; body: string }> = {
  revoked: {
    title: "Access revoked",
    body: "The document owner has just revoked this share link. It can no longer be viewed.",
  },
  expired: {
    title: "Link expired",
    body: "This share link has expired. Ask the document owner to send a new one.",
  },
  not_found: {
    title: "Link no longer valid",
    body: "This share link is no longer valid.",
  },
};

export default function VerifyGuard({
  token,
  children,
}: {
  token: string;
  children: React.ReactNode;
}) {
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
    const message = MESSAGES[invalidReason] ?? MESSAGES.revoked;
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
