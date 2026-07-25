import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;

function createSql(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(url);
}

declare global {
  var __hifadhiSql: Sql | undefined;
}

const rawSql: Sql = globalThis.__hifadhiSql ?? createSql();

if (process.env.NODE_ENV !== "production") {
  globalThis.__hifadhiSql = rawSql;
}

/**
 * Neon's serverless compute suspends after a few minutes of inactivity and
 * can time out on the first query that wakes it back up. Retry transient
 * connection errors a couple of times before giving up — real query errors
 * (constraint violations, bad SQL) are not retried.
 */
function isTransientConnectionError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const cause = err instanceof Error ? (err.cause as Error | undefined) : undefined;
  const combined = `${message} ${cause?.message ?? ""}`;
  return /fetch failed|ETIMEDOUT|ECONNRESET|ENOTFOUND|Error connecting to database/i.test(
    combined
  );
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 400;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES && isTransientConnectionError(err)) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1))
        );
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export const sql: Sql = new Proxy(rawSql, {
  apply(target, thisArg, args) {
    return withRetry(() => Reflect.apply(target, thisArg, args));
  },
}) as Sql;
