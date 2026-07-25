import { nanoid } from "nanoid";
import { sql } from "./db";

export type AuditAction =
  | "uploaded"
  | "viewed"
  | "shared"
  | "revoked"
  | "autofill_used";

export async function logAudit(params: {
  documentId: string;
  shareId?: string | null;
  action: AuditAction;
  actorLabel: string;
}) {
  await sql`
    INSERT INTO audit_log (id, document_id, share_id, action, actor_label)
    VALUES (${nanoid()}, ${params.documentId}, ${params.shareId ?? null}, ${params.action}, ${params.actorLabel})
  `;
}

export async function getAuditLogForDocument(documentId: string) {
  return sql`
    SELECT * FROM audit_log WHERE document_id = ${documentId} ORDER BY occurred_at DESC
  `;
}

export async function getAuditLogForUser(userId: string) {
  return sql`
    SELECT audit_log.*, documents.doc_type
    FROM audit_log
    JOIN documents ON documents.id = audit_log.document_id
    WHERE documents.user_id = ${userId}
    ORDER BY audit_log.occurred_at DESC
  `;
}
