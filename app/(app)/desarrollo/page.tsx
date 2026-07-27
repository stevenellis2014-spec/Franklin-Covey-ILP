import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { DesarrolloClient } from "./DesarrolloClient";

export default async function DesarrolloPage() {
  const { employee, role } = await getSessionContext();
  const supabase = await createClient();
  const [{ data: plans }, { data: employees }] = await Promise.all([
    supabase.from("development_plans").select("*").order("year", { ascending: false }),
    supabase.from("employees").select("id, name"),
  ]);

  return (
    <DesarrolloClient
      initialPlans={plans ?? []}
      employees={employees ?? []}
      currentEmployeeId={employee.id}
      scoped={role !== "colaborador"}
    />
  );
}
