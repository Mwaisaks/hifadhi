import type { DocType, DocumentAnalysis } from "./extraction";

/**
 * Below this confidence in the *type* classification we accept the citizen's
 * own label rather than overriding it. A blurry photo of a real ID must not be
 * refused just because Claude hedged on which kind of ID it is — the cost of a
 * false rejection (a citizen who cannot use the service) is much higher than
 * the cost of a mislabelled row.
 */
export const MIN_TYPE_CONFIDENCE = 0.5;

/**
 * Types we refuse to police against each other, because the distinction is a
 * genuine taxonomy overlap rather than a user mistake: a KRA PIN certificate
 * *is* a certificate, so either label is defensible for the same file.
 */
const INTERCHANGEABLE: Record<string, readonly DocType[]> = {
  kra_pin: ["certificate"],
  certificate: ["kra_pin"],
};

export type IntakeVerdict =
  | { ok: true }
  | { ok: false; code: "not_a_document"; summary: string | null }
  | {
      ok: false;
      code: "wrong_document_type";
      declared: DocType;
      detected: DocType;
    };

function typesAreCompatible(declared: DocType, detected: DocType): boolean {
  if (declared === detected) return true;
  return (INTERCHANGEABLE[declared] ?? []).includes(detected);
}

/**
 * Decides whether an upload may proceed, given what the citizen said the file
 * is and what Claude saw.
 *
 * Two independent failure modes:
 *  - the file isn't an official document at all (a selfie, a receipt, a meme)
 *  - it is a document, but not the one the citizen selected
 *
 * Everything else is accepted. In particular an official document whose type
 * Claude can't place ("unknown") passes: it's real, and we'd rather store it
 * under the citizen's own label than turn them away.
 */
export function checkIntake(
  declared: DocType,
  analysis: DocumentAnalysis
): IntakeVerdict {
  if (!analysis.is_official_document) {
    return {
      ok: false,
      code: "not_a_document",
      summary: analysis.content_summary?.trim() || null,
    };
  }

  // "Other" is not a claim about the type, so there is nothing to contradict.
  if (declared === "other") return { ok: true };

  const detected = analysis.detected_doc_type;
  if (!detected || detected === "unknown" || detected === "other") {
    return { ok: true };
  }

  const confidence = analysis.type_confidence ?? 0;
  if (confidence < MIN_TYPE_CONFIDENCE) return { ok: true };

  if (typesAreCompatible(declared, detected)) return { ok: true };

  return { ok: false, code: "wrong_document_type", declared, detected };
}
