import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getScanCounter } from "@/lib/redis";
import type { QRCodeRecord } from "@/lib/types";
import { toggleActive, deleteQrCode } from "./actions";

export default async function QRCodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: qr } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<QRCodeRecord>();

  if (!qr) notFound();

  const { count: totalScans } = await supabase
    .from("qr_scans")
    .select("*", { count: "exact", head: true })
    .eq("qr_code_id", qr.id);

  const liveCounter = await getScanCounter(qr.id);
  const scanCount = Math.max(totalScans ?? 0, liveCounter);

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;
  const protocol = baseDomain?.startsWith("localhost") ? "http" : "https";
  const publicUrl = `${protocol}://${baseDomain}/q/${qr.short_code}`;

  const { data: recentScans } = await supabase
    .from("qr_scans")
    .select("scanned_at, referrer, user_agent")
    .eq("qr_code_id", qr.id)
    .order("scanned_at", { ascending: false })
    .limit(10);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{qr.title}</h1>
            <a
              href={publicUrl}
              target="_blank"
              className="font-mono text-sm text-brand-600 hover:underline"
            >
              {publicUrl}
            </a>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              qr.is_active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {qr.is_active ? "Active" : "Paused"}
          </span>
        </div>

        <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-neutral-500">DETAILS SHOWN ON SCAN</h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailRow label="Description" value={qr.description} />
            <DetailRow label="Phone" value={qr.phone} />
            <DetailRow label="Email" value={qr.email} />
            <DetailRow label="Website" value={qr.website} />
            <DetailRow label="Address" value={qr.address} />
            <DetailRow label="Notes" value={qr.notes} />
          </dl>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-neutral-500">RECENT SCANS</h2>
          {!recentScans || recentScans.length === 0 ? (
            <p className="text-sm text-neutral-400">No scans yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100 text-sm">
              {recentScans.map((s, i) => (
                <li key={i} className="flex items-center justify-between py-2">
                  <span>{new Date(s.scanned_at).toLocaleString()}</span>
                  <span className="max-w-[50%] truncate text-neutral-400">
                    {s.referrer || "Direct"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <div className="mb-4 rounded-xl border border-neutral-200 bg-white p-6 text-center">
          <img
            src={`/api/qr/${qr.id}/preview`}
            alt="QR code preview"
            className="mx-auto mb-4 h-48 w-48"
          />
          <a
            href={`/api/qr/${qr.id}/pdf`}
            className="block w-full rounded-lg bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-600"
          >
            Download high-res PDF
          </a>
        </div>

        <div className="mb-4 rounded-xl border border-neutral-200 bg-white p-6 text-center">
          <p className="text-3xl font-bold">{scanCount}</p>
          <p className="text-sm text-neutral-500">Total scans</p>
        </div>

        <div className="flex flex-col gap-2">
          <form action={toggleActive}>
            <input type="hidden" name="qrId" value={qr.id} />
            <input type="hidden" name="shortCode" value={qr.short_code} />
            <input type="hidden" name="nextValue" value={(!qr.is_active).toString()} />
            <button className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100">
              {qr.is_active ? "Pause QR code" : "Activate QR code"}
            </button>
          </form>
          <form action={deleteQrCode}>
            <input type="hidden" name="qrId" value={qr.id} />
            <input type="hidden" name="shortCode" value={qr.short_code} />
            <button className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              Delete
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-neutral-400">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}
