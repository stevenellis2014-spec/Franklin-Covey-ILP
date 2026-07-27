import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { UsuariosClient } from "./UsuariosClient";

export default async function AdminUsuariosPage() {
  const { role, employee: currentEmployee } = await getSessionContext();
  if (role !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: employees }, { data: roles }, { data: orgUnits }] = await Promise.all([
    supabase.from("employees").select("*, roles(name, access_level)").order("name"),
    supabase.from("roles").select("*").order("name"),
    supabase.from("org_units").select("*"),
  ]);

  return (
    <UsuariosClient
      initialEmployees={employees ?? []}
      roles={roles ?? []}
      orgUnits={orgUnits ?? []}
      adminEmail={currentEmployee.email}
    />
  );
}
