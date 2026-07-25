"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, isLocale } from "./i18n";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Persists the citizen's language choice.
 *
 * A Server Function rather than a `document.cookie` write so the cookie is set
 * through response headers and the server tree re-renders in the same
 * roundtrip. Server Functions are reachable by direct POST, so the incoming
 * value is validated against the known locales rather than trusted — the worst
 * a crafted request can do is set its own UI language.
 */
export async function setLocale(value: string): Promise<void> {
  if (!isLocale(value)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });

  // Every screen carries localized copy, so revalidate the whole tree.
  revalidatePath("/", "layout");
}
