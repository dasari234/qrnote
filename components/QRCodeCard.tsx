import Link from "next/link";
import type { QRCodeRecord } from "@/lib/types";

export default function QRCodeCard({ qr }: { qr: QRCodeRecord }) {
  return (
    <Link
      href={`/dashboard/${qr.id}`}
      className="block rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-brand-500 hover:shadow-sm"
    >
      <div className="mb-2 flex items-start justify-between">
        <h2 className="font-semibold">{qr.title}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            qr.is_active
              ? "bg-green-100 text-green-700"
              : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {qr.is_active ? "Active" : "Paused"}
        </span>
      </div>
      {qr.description && (
        <p className="mb-3 line-clamp-2 text-sm text-neutral-500">
          {qr.description}
        </p>
      )}
      <p className="font-mono text-xs text-neutral-400">/{qr.short_code}</p>
    </Link>
  );
}
