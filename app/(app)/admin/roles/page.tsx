import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { RolesClient } from "./RolesClient";

export default async function AdminRolesPage() {
  const { role } = await getSessionContext();
  if (role !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: roles } = await supabase.from("roles").select("*").order("name");
  const { data: employees } = await supabase.from("employees").select("id, role_id");

  return <RolesClient initialRoles={roles ?? []} employees={employees ?? []} />;
}
