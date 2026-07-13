import QRCode from "qrcode";

export function getPublicUrlForCode(shortCode: string): string {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN!;
  const protocol = baseDomain.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${baseDomain}/q/${shortCode}`;
}

// High-resolution PNG buffer suitable for print (1000px, error
// correction level H so it still scans if partially damaged/covered).
export async function generateQrPngBuffer(url: string, size = 1000): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: 2,
    width: size,
    color: { dark: "#0A0A0A", light: "#FFFFFF" },
  });
}
