import QRCode from "qrcode";

/**
 * Renders a QR code as an inline SVG string.
 *
 * SVG rather than PNG so it stays crisp on a projector at any size, and so no
 * native image toolchain is needed. Generated server-side only — `qrcode` never
 * reaches the client bundle.
 */
export function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
    color: { dark: "#171717", light: "#ffffff" },
  });
}

/**
 * The origin a *scanning phone* should use to reach this app.
 *
 * `APP_ORIGIN` exists for the demo case: a QR encoding `http://localhost:3000`
 * is unscannable from a phone, so set `APP_ORIGIN` to the laptop's LAN address
 * (e.g. `http://192.168.1.20:3000`) or a tunnel URL before demoing.
 */
export function resolveAppOrigin(req: Request): string {
  const configured = process.env.APP_ORIGIN?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const firstValue = (header: string | null) =>
    header?.split(",")[0]?.trim() || null;

  const forwardedHost = firstValue(req.headers.get("x-forwarded-host"));
  if (forwardedHost) {
    const proto = firstValue(req.headers.get("x-forwarded-proto")) ?? "http";
    return `${proto}://${forwardedHost}`;
  }

  return new URL(req.url).origin;
}
