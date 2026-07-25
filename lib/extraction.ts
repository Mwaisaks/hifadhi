import { z } from "zod";
import { getClaude, CLAUDE_MODEL } from "./claude";

export const DOC_TYPES = [
  "national_id",
  "kra_pin",
  "passport",
  "certificate",
  "other",
] as const;

export type DocType = (typeof DOC_TYPES)[number];

export const extractedFieldsSchema = z.object({
  doc_type: z.enum(DOC_TYPES).nullable(),
  full_name: z.string().nullable(),
  id_number: z.string().nullable(),
  dob: z.string().nullable(),
  issue_date: z.string().nullable(),
  expiry_date: z.string().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
});

export type ExtractedFields = z.infer<typeof extractedFieldsSchema>;

/**
 * Claude's verdict on *what it was actually shown*, alongside the extraction.
 *
 * `is_official_document` is asked for separately from `detected_doc_type` on
 * purpose: "this is a document but I can't place the type" and "this is a
 * selfie" are different situations and the upload gate treats them differently.
 */
export const documentAnalysisSchema = z.object({
  is_official_document: z.boolean(),
  detected_doc_type: z.enum([...DOC_TYPES, "unknown"]).nullable(),
  type_confidence: z.number().min(0).max(1).nullable(),
  content_summary: z.string().nullable(),
  fields: extractedFieldsSchema,
});

export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;

const ANALYSIS_PROMPT = `You are the intake check for Hifadhi, a citizen document wallet. You are shown one file a citizen is trying to store. Do two jobs: decide what the file actually is, then extract its fields.

Return STRICT JSON only — no markdown, no code fences, no commentary — matching exactly this shape:

{
  "is_official_document": boolean,
  "detected_doc_type": "national_id" | "kra_pin" | "passport" | "certificate" | "other" | "unknown" | null,
  "type_confidence": number | null,
  "content_summary": string | null,
  "fields": {
    "doc_type": "national_id" | "kra_pin" | "passport" | "certificate" | "other" | null,
    "full_name": string | null,
    "id_number": string | null,
    "dob": string | null,
    "issue_date": string | null,
    "expiry_date": string | null,
    "confidence": number | null
  }
}

Rules for the verdict:
- "is_official_document": true only if this is a genuine official or institutional record — a national ID, KRA PIN certificate, passport, birth certificate, academic or professional certificate, licence, or similar. Set it to false for anything else: selfies and portrait photos, screenshots, memes, receipts, handwritten notes, blank or unreadable pages, random objects, scenery, or documents with no issuing authority.
- A photo of a person alone is NOT an official document, even if the person is holding something. The document itself must be the subject and its content must be legible.
- "detected_doc_type": the type you actually see. Use "unknown" if it is an official document but you cannot place it in one of the listed types. Use null only if "is_official_document" is false.
- "type_confidence": your 0-1 confidence in "detected_doc_type" specifically. Be honest and use a low value when the image is blurry, cropped, or ambiguous.
- "content_summary": at most 10 words, plainly describing what you see (e.g. "a selfie of a young man", "a supermarket receipt", "a blurred, unreadable page"). Keep it neutral and factual. This is shown to the citizen to explain a rejection.

Rules for "fields":
- Use null for any field not visible on the document. Never guess or hallucinate a value.
- Dates in YYYY-MM-DD if determinable, otherwise pass through the text as printed.
- "confidence" is your 0-1 estimate of the overall field extraction.
- If "is_official_document" is false, set every value inside "fields" to null.
- Output nothing but the JSON object.`;

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

/** Classifies and extracts in one vision call. */
export async function analyzeDocument(
  base64Data: string,
  mimeType: string
): Promise<DocumentAnalysis> {
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
          { type: "text", text: ANALYSIS_PROMPT },
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

  return documentAnalysisSchema.parse(parsed);
}

/** Fields-only view, for re-running extraction on an already-accepted document. */
export async function extractDocumentFields(
  base64Data: string,
  mimeType: string
): Promise<ExtractedFields> {
  const analysis = await analyzeDocument(base64Data, mimeType);
  return analysis.fields;
}
