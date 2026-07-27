import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AccessLevel = "admin" | "gerente" | "colaborador";

export type Employee = {
  id: string;
  auth_user_id: string;
  name: string;
  pos: string | null;
  org_unit_id: string | null;
  manager_id: string | null;
  email: string;
  role_id: string;
  hire_date: string | null;
  status: string;
  roles: { id: string; name: string; access_level: AccessLevel; description: string | null };
};

export async function getSessionContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: employee } = await supabase
    .from("employees")
    .select("*, roles(*)")
    .eq("auth_user_id", user.id)
    .single();

  if (!employee) redirect("/login");

  const emp = employee as unknown as Employee;
  const baseLevel = emp.roles.access_level;

  const { count: reportsCount } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("manager_id", emp.id);

  const isManager = (reportsCount ?? 0) > 0;
  const canToggleMode = baseLevel === "admin";

  const cookieStore = await cookies();
  const modeCookie = cookieStore.get("ilp_mode")?.value;
  const mode: "admin" | "normal" = modeCookie === "normal" ? "normal" : "admin";

  let role: AccessLevel;
  if (baseLevel === "admin") {
    role = mode === "admin" ? "admin" : "gerente";
  } else if (baseLevel === "gerente") {
    role = "gerente";
  } else {
    role = "colaborador";
  }

  return { employee: emp, role, mode, canToggleMode, isManager };
}
