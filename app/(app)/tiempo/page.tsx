import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { currentIsoWeek } from "@/lib/format";
import { TiempoClient } from "./TiempoClient";

export default async function TiempoPage() {
  const { employee, role } = await getSessionContext();
  const supabase = await createClient();
  const [{ data: tasks }, { data: employees }] = await Promise.all([
    supabase.from("tasks").select("*"),
    supabase.from("employees").select("id, name"),
  ]);

  return (
    <TiempoClient
      initialTasks={tasks ?? []}
      employees={employees ?? []}
      currentEmployeeId={employee.id}
      scoped={role !== "colaborador"}
      week={currentIsoWeek()}
    />
  );
}
