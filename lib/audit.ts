import { nanoid } from "nanoid";
import { db } from "./db";

export type AuditAction =
  | "uploaded"
  | "viewed"
  | "shared"
  | "revoked"
  | "autofill_used";

export function logAudit(params: {
  documentId: string;
  shareId?: string | null;
  action: AuditAction;
  actorLabel: string;
}) {
  db.prepare(
    `INSERT INTO audit_log (id, document_id, share_id, action, actor_label)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    nanoid(),
    params.documentId,
    params.shareId ?? null,
    params.action,
    params.actorLabel
  );
}

export function getAuditLogForDocument(documentId: string) {
  return db
    .prepare(
      `SELECT * FROM audit_log WHERE document_id = ? ORDER BY occurred_at DESC`
    )
    .all(documentId);
}

export function getAuditLogForUser(userId: string) {
  return db
    .prepare(
      `SELECT audit_log.*, documents.doc_type
       FROM audit_log
       JOIN documents ON documents.id = audit_log.document_id
       WHERE documents.user_id = ?
       ORDER BY audit_log.occurred_at DESC`
    )
    .all(userId);
}
