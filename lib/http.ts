/**
 * Parses a fetch Response as JSON without throwing on an empty or malformed
 * body — a route handler that crashes with an uncaught exception returns an
 * empty error body, and `res.json()` on that throws "Unexpected end of JSON
 * input" instead of surfacing a usable error to the UI.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors res.json()'s own (any) return type
export async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) {
    return { error: `Request failed (${res.status})` };
  }
  try {
    return JSON.parse(text);
  } catch {
    return { error: `Unexpected server response (${res.status})` };
  }
}
