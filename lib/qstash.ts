import { Client, Receiver } from "@upstash/qstash";

export const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export const qstashReceiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

interface ScanEventPayload {
  qrCodeId: string;
  ip: string | null;
  userAgent: string | null;
  referrer: string | null;
}

// Queues a scan event to be durably written to Postgres by the
// /api/track route, keeping the public /q/[code] page fast and
// decoupled from the analytics write path.
export async function queueScanEvent(payload: ScanEventPayload) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  await qstashClient.publishJSON({
    url: `${appUrl}/api/track`,
    body: payload,
    retries: 3,
  });
}
