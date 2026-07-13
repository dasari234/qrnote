import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { generateQrPngBuffer, getPublicUrlForCode } from "@/lib/qr-image";
import type { QRCodeRecord } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: qr } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<QRCodeRecord>();

  if (!qr) return new NextResponse("Not found", { status: 404 });

  const publicUrl = getPublicUrlForCode(qr.short_code);
  const qrPng = await generateQrPngBuffer(publicUrl, 1200);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter, points
  const { width } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const qrImage = await pdfDoc.embedPng(qrPng);
  const qrDisplaySize = 320;
  const qrX = (width - qrDisplaySize) / 2;
  let cursorY = 700;

  page.drawImage(qrImage, {
    x: qrX,
    y: cursorY - qrDisplaySize,
    width: qrDisplaySize,
    height: qrDisplaySize,
  });
  cursorY -= qrDisplaySize + 40;

  const drawCenteredText = (text: string, size: number, useFont = font, color = rgb(0.05, 0.05, 0.07)) => {
    const textWidth = useFont.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: cursorY,
      size,
      font: useFont,
      color,
    });
    cursorY -= size + 12;
  };

  drawCenteredText(qr.title, 22, boldFont);

  const details: Array<[string, string | null]> = [
    ["", qr.description],
    ["Phone", qr.phone],
    ["Email", qr.email],
    ["Website", qr.website],
    ["Address", qr.address],
    ["Notes", qr.notes],
  ];

  for (const [label, value] of details) {
    if (!value) continue;
    const text = label ? `${label}: ${value}` : value;
    // Wrap long lines manually at ~90 chars for point size 12.
    const chunks = wrapText(text, 90);
    for (const chunk of chunks) {
      drawCenteredText(chunk, 12, font, rgb(0.25, 0.25, 0.3));
    }
  }

  cursorY -= 10;
  drawCenteredText(publicUrl, 10, font, rgb(0.6, 0.6, 0.65));

  const pdfBytes = await pdfDoc.save();
  const filename = `${qr.short_code}-qr.pdf`;

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      lines.push(current.trim());
      current = word;
    } else {
      current += " " + word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}
