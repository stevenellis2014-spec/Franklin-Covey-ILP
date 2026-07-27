import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { McisClient } from "./McisClient";

export default async function McisPage() {
  const { employee, role } = await getSessionContext();
  const supabase = await createClient();

  const [{ data: mcis }, { data: leadMeasures }, { data: employees }, { data: orgUnits }] =
    await Promise.all([
      supabase.from("mcis").select("*").order("level"),
      supabase.from("lead_measures").select("*"),
      supabase.from("employees").select("id, name"),
      supabase.from("org_units").select("id, name, parent_id"),
    ]);

  return (
    <McisClient
      initialMcis={mcis ?? []}
      initialLeadMeasures={leadMeasures ?? []}
      employees={employees ?? []}
      orgUnits={orgUnits ?? []}
      currentEmployeeId={employee.id}
      role={role}
    />
  );
}
