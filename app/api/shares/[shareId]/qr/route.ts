import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { qrSvg, resolveAppOrigin } from "@/lib/qr";
import { shareState } from "@/lib/expiry";

interface ShareOwnerRow {
  share_token: string;
  expires_at: string;
  revoked: boolean;
  owner_id: string;
}

/**
 * Returns a QR code for a share link, as SVG.
 *
 * Owner-only on purpose. The share token is itself the secret, so anyone
 * holding it could already view the document — but gating this route means it
 * can't be used as an oracle to probe which tokens exist, and it keeps the
 * "every path to a document is consent-checked" claim in NOTES.md literally
 * true. The QR is a tool for the owner to *present* a link they already have.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { shareId } = await params;

  const rows = (await sql`
    SELECT s.share_token, s.expires_at, s.revoked, d.user_id AS owner_id
    FROM shares s
    JOIN documents d ON d.id = s.document_id
    WHERE s.id = ${shareId}
  `) as ShareOwnerRow[];
  const share = rows[0];

  if (!share || share.owner_id !== user.id) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  if (shareState(share) !== "active") {
    return NextResponse.json(
      { error: "This share link is no longer active" },
      { status: 410 }
    );
  }

  const url = `${resolveAppOrigin(req)}/verify/${share.share_token}`;
  const svg = await qrSvg(url);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Scoped to one citizen's revocable link — never cache it anywhere.
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
