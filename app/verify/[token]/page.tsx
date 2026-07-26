import { sql } from "@/lib/db";
import { decryptBuffer } from "@/lib/crypto";
import { downloadDocumentBlob } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { getLocaleAndDictionary } from "@/lib/i18n-server";
import { docTypeLabel } from "@/lib/i18n";
import { shareState } from "@/lib/expiry";
import VerifyGuard from "./VerifyGuard";

export const dynamic = "force-dynamic";

interface ShareRow {
  id: string;
  document_id: string;
  shared_with_label: string;
  expires_at: string;
  revoked: boolean;
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

function StatusScreen({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-sm text-center">
        <p className="text-sm font-medium text-emerald-700 mb-2 tracking-wide uppercase">
          Hifadhi
        </p>
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">{title}</h1>
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
  const { locale, dict } = await getLocaleAndDictionary();

  const shareRows = (await sql`
    SELECT id, document_id, shared_with_label, expires_at, revoked
    FROM shares WHERE share_token = ${token}
  `) as ShareRow[];
  const share = shareRows[0];

  if (!share) {
    return (
      <StatusScreen
        title={dict.verify.notFoundTitle}
        body={dict.verify.notFoundBody}
      />
    );
  }

  const state = shareState(share);

  if (state === "revoked") {
    return (
      <StatusScreen
        title={dict.verify.revokedTitle}
        body={dict.verify.revokedBody}
      />
    );
  }

  if (state === "expired") {
    return (
      <StatusScreen
        title={dict.verify.expiredTitle}
        body={dict.verify.expiredBody}
      />
    );
  }

  const docRows = (await sql`
    SELECT id, doc_type, mime_type, file_path, iv, auth_tag, extracted_fields
    FROM documents WHERE id = ${share.document_id}
  `) as DocumentRow[];
  const doc = docRows[0];

  if (!doc) {
    return (
      <StatusScreen
        title={dict.verify.unavailableTitle}
        body={dict.verify.unavailableBody}
      />
    );
  }

  const ciphertext = await downloadDocumentBlob(doc.file_path);
  const plaintext = decryptBuffer(ciphertext, doc.iv, doc.auth_tag);
  const base64Data = plaintext.toString("base64");

  await logAudit({
    documentId: doc.id,
    shareId: share.id,
    action: "viewed",
    actorLabel: share.shared_with_label,
  });

  const fields = doc.extracted_fields ? JSON.parse(doc.extracted_fields) : null;
  const isImage = doc.mime_type.startsWith("image/");
  const isPdf = doc.mime_type === "application/pdf";

  return (
    <VerifyGuard token={token} locale={locale}>
      <div className="min-h-screen bg-neutral-50">
        {/*
          No language toggle on this screen, deliberately: rendering this page
          logs a `viewed` audit entry, so a toggle here would manufacture extra
          "Viewed" rows in the owner's audit trail every time the verifier
          switched language. The page still honours the viewer's own locale
          cookie — the verifier is a different person from the sender and gets
          their own preference, not one inherited through the link.
        */}
        <header className="border-b border-neutral-200 bg-white">
          <div className="max-w-2xl mx-auto px-6 py-4">
            <p className="text-sm font-medium text-emerald-700 tracking-wide uppercase">
              Hifadhi
            </p>
            <p className="text-xs text-neutral-500">
              {dict.verify.sharedWith(share.shared_with_label)}
            </p>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-6 py-10">
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-5 border-b border-neutral-200">
              <p className="font-medium text-neutral-900">
                {docTypeLabel(doc.doc_type, dict)}
              </p>
            </div>
            {isImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:${doc.mime_type};base64,${base64Data}`}
                alt={dict.verify.documentAlt}
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
                    <p className="text-neutral-400">
                      {dict.confirm.fields.full_name}
                    </p>
                    <p className="text-neutral-900">{fields.full_name}</p>
                  </div>
                )}
                {fields.id_number && (
                  <div>
                    <p className="text-neutral-400">
                      {dict.confirm.fields.id_number}
                    </p>
                    <p className="text-neutral-900">{fields.id_number}</p>
                  </div>
                )}
                {fields.dob && (
                  <div>
                    <p className="text-neutral-400">{dict.confirm.fields.dob}</p>
                    <p className="text-neutral-900">{fields.dob}</p>
                  </div>
                )}
                {fields.expiry_date && (
                  <div>
                    <p className="text-neutral-400">
                      {dict.confirm.fields.expiry_date}
                    </p>
                    <p className="text-neutral-900">{fields.expiry_date}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-4 text-center">
            {dict.verify.footer(
              new Date(share.expires_at).toLocaleString(locale)
            )}
          </p>
        </main>
      </div>
    </VerifyGuard>
  );
}
