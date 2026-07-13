"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invalidateCachedQr } from "@/lib/redis";

export async function toggleActive(formData: FormData) {
  const qrId = String(formData.get("qrId"));
  const shortCode = String(formData.get("shortCode"));
  const nextValue = formData.get("nextValue") === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("qr_codes")
    .update({ is_active: nextValue })
    .eq("id", qrId)
    .eq("user_id", user.id);

  await invalidateCachedQr(shortCode);
  revalidatePath(`/dashboard/${qrId}`);
}

export async function deleteQrCode(formData: FormData) {
  const qrId = String(formData.get("qrId"));
  const shortCode = String(formData.get("shortCode"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("qr_codes").delete().eq("id", qrId).eq("user_id", user.id);
  await invalidateCachedQr(shortCode);
  redirect("/dashboard");
}
