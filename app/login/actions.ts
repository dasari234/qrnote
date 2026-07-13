"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  
  // 1. Get the real domain the user is accessing the app from (e.g., your ngrok link)
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseOrigin = `${protocol}://${host}`;

  // 2. Safely parse the target path
  let redirectToPath = String(formData.get("redirectTo") || "/dashboard");
  if (!redirectToPath.startsWith("/")) {
    redirectToPath = `/${redirectToPath}`;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Force absolute path mapping for error redirections
    redirect(`${baseOrigin}/login?error=${encodeURIComponent(error.message)}`);
  }

  // 3. Force an absolute URL redirect so your phone stays locked to ngrok!
  redirect(`${baseOrigin}${redirectToPath}`);
}
