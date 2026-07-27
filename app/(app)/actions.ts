"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete("ilp_mode");
  redirect("/login");
}

export async function toggleMode() {
  const cookieStore = await cookies();
  const current = cookieStore.get("ilp_mode")?.value === "normal" ? "normal" : "admin";
  const next = current === "admin" ? "normal" : "admin";
  cookieStore.set("ilp_mode", next, { path: "/" });
  redirect("/dashboard");
}
