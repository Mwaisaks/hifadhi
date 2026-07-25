import { z } from "zod";
import { getClaude, CLAUDE_MODEL } from "./claude";

export const extractedFieldsSchema = z.object({
  doc_type: z
    .enum(["national_id", "kra_pin", "passport", "certificate", "other"])
    .nullable(),
  full_name: z.string().nullable(),
  id_number: z.string().nullable(),
  dob: z.string().nullable(),
  issue_date: z.string().nullable(),
  expiry_date: z.string().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
});

export type ExtractedFields = z.infer<typeof extractedFieldsSchema>;

const EXTRACTION_PROMPT = `You are extracting structured identity data from a photo of a government-issued document (e.g. Kenyan national ID, KRA PIN certificate, passport, or academic/professional certificate).

Return STRICT JSON only — no markdown, no code fences, no commentary — matching exactly this shape:

{
  "doc_type": "national_id" | "kra_pin" | "passport" | "certificate" | "other" | null,
  "full_name": string | null,
  "id_number": string | null,
  "dob": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "confidence": number | null
}

Rules:
- Use null for any field that is not visible or not present on the document. Never guess or hallucinate a value.
- Dates should be in YYYY-MM-DD format if determinable, otherwise pass through the text as printed.
- "confidence" is your own 0-1 estimate of how confident you are in the overall extraction.
- Output nothing but the JSON object.`;

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

export async function extractDocumentFields(
  base64Data: string,
  mimeType: string
): Promise<ExtractedFields> {
  const anthropic = getClaude();

  const isPdf = mimeType === "application/pdf";
  const supportedMediaType = (
    ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType)
      ? mimeType
      : "image/jpeg"
  ) as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          isPdf
            ? {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64Data,
                },
              }
            : {
                type: "image",
                source: {
                  type: "base64",
                  media_type: supportedMediaType,
                  data: base64Data,
                },
              },
          { type: "text", text: EXTRACTION_PROMPT },
        ],
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  const rawText = block?.type === "text" ? block.text : "{}";
  const jsonText = stripCodeFences(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Claude did not return valid JSON for extraction");
  }

  return extractedFieldsSchema.parse(parsed);
}
