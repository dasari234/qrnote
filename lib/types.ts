export interface QRCodeRecord {
  id: string;
  user_id: string;
  short_code: string;
  title: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QRScanRecord {
  id: string;
  qr_code_id: string;
  scanned_at: string;
  ip: string | null;
  user_agent: string | null;
  referrer: string | null;
}

// Subset of QRCodeRecord that is safe to cache in Redis and show
// on the public scan-landing page.
export type PublicQRData = Pick<
  QRCodeRecord,
  | "id"
  | "short_code"
  | "title"
  | "description"
  | "phone"
  | "email"
  | "website"
  | "address"
  | "notes"
  | "is_active"
>;
