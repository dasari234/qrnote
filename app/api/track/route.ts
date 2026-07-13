import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { incrementScanCounter } from "@/lib/redis";

async function handler(request: Request) {
  const body = await request.json();
  const { qrCodeId, ip, userAgent, referrer } = body as {
    qrCodeId: string;
    ip: string | null;
    userAgent: string | null;
    referrer: string | null;
  };

  if (!qrCodeId) {
    return NextResponse.json({ error: "Missing qrCodeId" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  await supabase.from("qr_scans").insert({
    qr_code_id: qrCodeId,
    ip,
    user_agent: userAgent,
    referrer,
  });

  await incrementScanCounter(qrCodeId);

  return NextResponse.json({ ok: true });
}

// Verifies the QStash signature header so this endpoint can't be
// spoofed by third parties even though it's a public URL.
export const POST = verifySignatureAppRouter(handler);
