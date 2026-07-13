import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateQrPngBuffer, getPublicUrlForCode } from "@/lib/qr-image";

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
    .select("short_code")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!qr) return new NextResponse("Not found", { status: 404 });

  const png = await generateQrPngBuffer(getPublicUrlForCode(qr.short_code), 400);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=300",
    },
  });
}
