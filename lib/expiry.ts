/**
 * Expiry maths for documents and share links.
 *
 * Lives outside the component tree deliberately: reading the clock is impure,
 * and keeping it here means pages and client components can ask "is this stale
 * yet?" without a `react-hooks/purity` suppression at every call site.
 */

export const RENEWAL_WINDOW_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Normalises a confirmed expiry date for storage in `documents.expires_at`.
 *
 * Claude extracts (and the citizen confirms) a date, not an instant. Storing it
 * as midnight would mark the document expired a day early and make every
 * countdown read one day short, so a date-only value is pinned to the last
 * instant of that day — the way a human reads the date printed on an ID.
 */
export function normalizeExpiryForStorage(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const timestamp = parseTimestamp(value);
  return timestamp === null ? null : new Date(timestamp).toISOString();
}

export type ExpiryLevel = "expired" | "renew_soon" | "ok";

export interface ExpiryInfo {
  level: ExpiryLevel;
  /** Whole days until expiry; negative once the date has passed. */
  daysRemaining: number;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Document expiry dates are extracted date-only ("2026-08-05"), while share
 * links store a full ISO instant. A date-only value has to mean the *end* of
 * that day: an ID stamped "expires 5 Aug" is valid all day on the 5th, and
 * parsing it as midnight would both declare it expired ~24h early and report
 * every countdown one day short.
 *
 * Accepts a `Date` as well as a string because Postgres `TIMESTAMPTZ` columns
 * come back from the Neon driver as native `Date` objects, not strings — only
 * a raw, not-yet-stored value (e.g. straight from Claude's extraction) is
 * ever a date-only string.
 */
function parseTimestamp(value: string | Date): number | null {
  if (value instanceof Date) {
    const parsed = value.getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }
  const parsed = DATE_ONLY.test(value.trim())
    ? new Date(`${value.trim()}T23:59:59.999Z`).getTime()
    : new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Returns null when there is no usable expiry date — an unparseable value is
 * treated as "no data" rather than "expired", so a bad extraction can never
 * raise a false alarm on the dashboard.
 */
export function expiryInfo(
  expiresAt: string | Date | null | undefined,
  now: number = Date.now()
): ExpiryInfo | null {
  if (!expiresAt) return null;
  const expiryTime = parseTimestamp(expiresAt);
  if (expiryTime === null) return null;

  const daysRemaining = Math.floor((expiryTime - now) / MS_PER_DAY);

  if (expiryTime < now) {
    return { level: "expired", daysRemaining };
  }
  if (daysRemaining < RENEWAL_WINDOW_DAYS) {
    return { level: "renew_soon", daysRemaining };
  }
  return { level: "ok", daysRemaining };
}

/** True for documents the citizen should act on — expired or inside the window. */
export function needsRenewal(info: ExpiryInfo | null): boolean {
  return info !== null && info.level !== "ok";
}

export type ShareState = "active" | "expired" | "revoked";

/**
 * Note the deliberate asymmetry with `expiryInfo` above: that one treats an
 * unreadable date as "no data" so a bad extraction can't raise a false renewal
 * alarm, whereas this one treats it as *expired*. This function gates document
 * access on `/verify/[token]`, so it fails closed — a row we can't reason about
 * is never grounds for showing someone's ID.
 */
export function shareState(
  share: { expires_at: string | Date; revoked: boolean | number },
  now: number = Date.now()
): ShareState {
  if (share.revoked) return "revoked";
  const expiryTime = parseTimestamp(share.expires_at);
  if (expiryTime === null || expiryTime < now) return "expired";
  return "active";
}
