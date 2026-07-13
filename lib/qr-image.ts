import QRCode from "qrcode";

export function getPublicUrlForCode(shortCode: string): string {
  let baseUrl: string;

  if (process.env.NEXT_PUBLIC_BASE_DOMAIN) {
    baseUrl = process.env.NEXT_PUBLIC_BASE_DOMAIN;
  } else if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  } else {
    baseUrl = "http://localhost:3000";
  }

  // Remove any trailing slash
  baseUrl = baseUrl.replace(/\/$/, "");

  return `${baseUrl}/q/${shortCode}`;
}

// High-resolution PNG buffer suitable for print
export async function generateQrPngBuffer(
  url: string,
  size = 1000
): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: 2,
    width: size,
    color: {
      dark: "#0A0A0A",
      light: "#FFFFFF",
    },
  });
}