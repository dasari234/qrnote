import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getCachedQr, setCachedQr, scanRatelimit, incrementScanCounter } from "@/lib/redis";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { queueScanEvent } from "@/lib/qstash";
import type { PublicQRData } from "@/lib/types";

async function fetchQr(code: string): Promise<PublicQRData | null> {
  const cached = await getCachedQr(code);
  if (cached) return cached;

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("qr_codes")
    .select("id, short_code, title, description, phone, email, website, address, notes, is_active")
    .eq("short_code", code)
    .single();

  if (!data) return null;

  await setCachedQr(code, data as PublicQRData);
  return data as PublicQRData;
}

async function recordScan(qrCodeId: string, ip: string | null, userAgent: string | null, referrer: string | null) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const payload = { qrCodeId, ip, userAgent, referrer };

  try {
    if (appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
      // QStash can't call back to localhost in local dev - write
      // directly and still bump the fast counter so the dashboard
      // reflects it immediately.
      const supabase = createServiceRoleClient();
      await supabase.from("qr_scans").insert({
        qr_code_id: qrCodeId,
        ip,
        user_agent: userAgent,
        referrer,
      });
      await incrementScanCounter(qrCodeId);
    } else {
      await queueScanEvent(payload);
    }
  } catch {
    // Never let analytics failures break the scan-landing experience.
  }
}

export default async function ScanLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    null;

  const { success: allowed } = await scanRatelimit.limit(ip ?? "anonymous");
  if (!allowed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-neutral-500">Too many requests. Please try again shortly.</p>
      </main>
    );
  }

  const qr = await fetchQr(code);
  if (!qr || !qr.is_active) notFound();

  // Fire-and-forget: do not block rendering on analytics.
  void recordScan(
    qr.id,
    ip,
    headerList.get("user-agent"),
    headerList.get("referer")
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">{qr.title}</h1>
        {qr.description && <p className="mb-6 text-neutral-600">{qr.description}</p>}

        <dl className="flex flex-col gap-4">
          <InfoRow label="Phone" value={qr.phone} href={qr.phone ? `tel:${qr.phone}` : undefined} />
          <InfoRow label="Email" value={qr.email} href={qr.email ? `mailto:${qr.email}` : undefined} />
          <InfoRow
            label="Website"
            value={qr.website}
            href={qr.website ? normalizeUrl(qr.website) : undefined}
          />
          <InfoRow label="Address" value={qr.address} />
          <InfoRow label="Notes" value={qr.notes} />
        </dl>
      </div>
    </main>
  );
}

function normalizeUrl(url: string) {
  return url.startsWith("http") ? url : `https://${url}`;
}

function InfoRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null;
  href?: string;
}) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</dt>
      {href ? (
        <a href={href} className="text-brand-600 hover:underline">
          {value}
        </a>
      ) : (
        <dd className="text-neutral-800">{value}</dd>
      )}
    </div>
  );
}
