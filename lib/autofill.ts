import { z } from "zod";
import { getClaude, CLAUDE_MODEL } from "./claude";
import type { FormSchema } from "./forms";

export interface WalletDocument {
  document_id: string;
  doc_type: string;
  full_name: string | null;
  id_number: string | null;
  dob: string | null;
  issue_date: string | null;
  expiry_date: string | null;
}

const fillPlanSchema = z.object({
  fields: z.record(
    z.string(),
    z.object({
      value: z.string().nullable(),
      source_document_id: z.string().nullable(),
    })
  ),
});

export interface FillPlanEntry {
  value: string | null;
  sourceDocumentId: string | null;
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

export async function mapWalletToForm(
  walletDocuments: WalletDocument[],
  form: FormSchema
): Promise<Record<string, FillPlanEntry>> {
  const empty: Record<string, FillPlanEntry> = {};
  for (const field of form.fields) {
    empty[field.key] = { value: null, sourceDocumentId: null };
  }

  if (walletDocuments.length === 0) {
    return empty;
  }

  const anthropic = getClaude();

  const prompt = `You are helping pre-fill a government-style form using a citizen's previously verified documents stored in their Hifadhi wallet.

WALLET DATA (JSON array of documents, each already extracted and confirmed by the citizen):
${JSON.stringify(walletDocuments, null, 2)}

TARGET FORM FIELDS:
${JSON.stringify(
  form.fields.map((f) => ({ key: f.key, label: f.label })),
  null,
  2
)}

For each target form field, find the best matching value from the wallet data, if one exists. Only use data that is actually present in the wallet — never invent or guess a value. If no wallet field matches, use null.

Return STRICT JSON only, no markdown, no commentary, in exactly this shape:
{
  "fields": {
    "<field_key>": { "value": string | null, "source_document_id": string | null }
  }
}

"source_document_id" must be the "document_id" of the wallet document the value came from, or null if value is null.`;

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content.find((b) => b.type === "text");
  const rawText = block?.type === "text" ? block.text : "{}";
  const jsonText = stripCodeFences(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Claude did not return valid JSON for auto-fill");
  }

  const result = fillPlanSchema.parse(parsed);

  const fillPlan: Record<string, FillPlanEntry> = {};
  for (const field of form.fields) {
    const entry = result.fields[field.key];
    fillPlan[field.key] = entry
      ? { value: entry.value, sourceDocumentId: entry.source_document_id }
      : { value: null, sourceDocumentId: null };
  }
  return fillPlan;
}
