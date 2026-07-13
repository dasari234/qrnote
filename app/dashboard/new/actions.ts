"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateShortCode } from "@/lib/shortcode";
import { setCachedQr, createQrRatelimit } from "@/lib/redis";
import type { PublicQRData } from "@/lib/types";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  website: z.string().trim().max(300).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function createQrCode(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { success: allowed } = await createQrRatelimit.limit(user.id);
  if (!allowed) {
    redirect(
      `/dashboard/new?error=${encodeURIComponent(
        "Too many QR codes created recently. Please wait a minute and try again."
      )}`
    );
  }

  const parsed = schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    website: formData.get("website"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input";
    redirect(`/dashboard/new?error=${encodeURIComponent(message)}`);
  }

  const values = parsed.data;
  const normalized = {
    title: values.title,
    description: values.description || null,
    phone: values.phone || null,
    email: values.email || null,
    website: values.website || null,
    address: values.address || null,
    notes: values.notes || null,
  };

  // Try a few times in the (very unlikely) event of a short_code collision.
  let inserted: { id: string; short_code: string } | null = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
    const shortCode = generateShortCode();
    const { data, error } = await supabase
      .from("qr_codes")
      .insert({ ...normalized, user_id: user.id, short_code: shortCode })
      .select("id, short_code")
      .single();

    if (!error && data) {
      inserted = data;
    } else {
      lastError = error?.message ?? "Unknown error";
    }
  }

  if (!inserted) {
    redirect(`/dashboard/new?error=${encodeURIComponent(lastError ?? "Could not create QR code")}`);
  }

  const cachePayload: PublicQRData = {
    id: inserted.id,
    short_code: inserted.short_code,
    title: normalized.title,
    description: normalized.description,
    phone: normalized.phone,
    email: normalized.email,
    website: normalized.website,
    address: normalized.address,
    notes: normalized.notes,
    is_active: true,
  };
  await setCachedQr(inserted.short_code, cachePayload);

  redirect(`/dashboard/${inserted.id}`);
}
