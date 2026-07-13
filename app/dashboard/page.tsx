import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { QRCodeRecord } from "@/lib/types";
import QRCodeCard from "@/components/QRCodeCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: qrCodes } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<QRCodeRecord[]>();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your QR codes</h1>
        <Link
          href="/dashboard/new"
          className="rounded-lg bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-600"
        >
          + New QR code
        </Link>
      </div>

      {!qrCodes || qrCodes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center text-neutral-500">
          No QR codes yet. Create your first one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {qrCodes.map((qr) => (
            <QRCodeCard key={qr.id} qr={qr} />
          ))}
        </div>
      )}
    </div>
  );
}
