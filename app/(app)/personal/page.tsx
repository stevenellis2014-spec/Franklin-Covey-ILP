import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PersonalClient } from "./PersonalClient";

export default async function PersonalPage() {
  const { role, employee } = await getSessionContext();
  if (role !== "gerente") redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: directs }, { data: orgUnits }] = await Promise.all([
    supabase.from("employees").select("*").eq("manager_id", employee.id).order("name"),
    supabase.from("org_units").select("id, name, parent_id"),
  ]);

  return <PersonalClient initialDirects={directs ?? []} orgUnits={orgUnits ?? []} />;
}
