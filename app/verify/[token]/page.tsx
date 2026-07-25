import fs from "fs/promises";
import { db } from "@/lib/db";
import { decryptBuffer } from "@/lib/crypto";
import { absoluteDocumentPath } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

interface ShareRow {
  id: string;
  document_id: string;
  shared_with_label: string;
  expires_at: string;
  revoked: number;
}

interface DocumentRow {
  id: string;
  doc_type: string;
  mime_type: string;
  file_path: string;
  iv: string;
  auth_tag: string;
  extracted_fields: string | null;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  national_id: "National ID",
  kra_pin: "KRA PIN Certificate",
  passport: "Passport",
  certificate: "Certificate",
  other: "Document",
};

function StatusScreen({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-sm text-center">
        <p className="text-sm font-medium text-emerald-700 mb-2 tracking-wide uppercase">
          Hifadhi
        </p>
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">
          {title}
        </h1>
        <p className="text-sm text-neutral-500">{body}</p>
      </div>
    </div>
  );
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const share = db
    .prepare(
      `SELECT id, document_id, shared_with_label, expires_at, revoked
       FROM shares WHERE share_token = ?`
    )
    .get(token) as ShareRow | undefined;

  if (!share) {
    return (
      <StatusScreen
        title="Link not found"
        body="This share link doesn't exist. Ask the document owner to send a new one."
      />
    );
  }

  if (share.revoked) {
    return (
      <StatusScreen
        title="Access revoked"
        body="The document owner has revoked this share link. It can no longer be viewed."
      />
    );
  }

  if (new Date(share.expires_at).getTime() < Date.now()) {
    return (
      <StatusScreen
        title="Link expired"
        body="This share link has expired. Ask the document owner to send a new one."
      />
    );
  }

  const doc = db
    .prepare(
      `SELECT id, doc_type, mime_type, file_path, iv, auth_tag, extracted_fields
       FROM documents WHERE id = ?`
    )
    .get(share.document_id) as DocumentRow | undefined;

  if (!doc) {
    return (
      <StatusScreen
        title="Document unavailable"
        body="This document is no longer available."
      />
    );
  }

  const ciphertext = await fs.readFile(absoluteDocumentPath(doc.file_path));
  const plaintext = decryptBuffer(ciphertext, doc.iv, doc.auth_tag);
  const base64Data = plaintext.toString("base64");

  logAudit({
    documentId: doc.id,
    shareId: share.id,
    action: "viewed",
    actorLabel: share.shared_with_label,
  });

  const fields = doc.extracted_fields ? JSON.parse(doc.extracted_fields) : null;
  const isImage = doc.mime_type.startsWith("image/");
  const isPdf = doc.mime_type === "application/pdf";

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <p className="text-sm font-medium text-emerald-700 tracking-wide uppercase">
            Hifadhi
          </p>
          <p className="text-xs text-neutral-500">
            Shared with: {share.shared_with_label} · view-only · this view has
            been logged for the document owner
          </p>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="p-5 border-b border-neutral-200">
            <p className="font-medium text-neutral-900">
              {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
            </p>
          </div>
          {isImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:${doc.mime_type};base64,${base64Data}`}
              alt="Shared document"
              className="w-full"
            />
          )}
          {isPdf && (
            <embed
              src={`data:application/pdf;base64,${base64Data}`}
              type="application/pdf"
              className="w-full h-[600px]"
            />
          )}
          {fields && (
            <div className="p-5 border-t border-neutral-200 grid grid-cols-2 gap-3 text-sm">
              {fields.full_name && (
                <div>
                  <p className="text-neutral-400">Full name</p>
                  <p className="text-neutral-900">{fields.full_name}</p>
                </div>
              )}
              {fields.id_number && (
                <div>
                  <p className="text-neutral-400">ID / document number</p>
                  <p className="text-neutral-900">{fields.id_number}</p>
                </div>
              )}
              {fields.dob && (
                <div>
                  <p className="text-neutral-400">Date of birth</p>
                  <p className="text-neutral-900">{fields.dob}</p>
                </div>
              )}
              {fields.expiry_date && (
                <div>
                  <p className="text-neutral-400">Expiry date</p>
                  <p className="text-neutral-900">{fields.expiry_date}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-neutral-400 mt-4 text-center">
          This link expires {new Date(share.expires_at).toLocaleString()}. The
          owner can revoke access at any time.
        </p>
      </main>
    </div>
  );
}
