import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { ReconocimientoClient } from "./ReconocimientoClient";

const BADGES = [
  "Enfoque en el cliente",
  "Trabajo en equipo",
  "Disciplina de ejecución",
  "Liderazgo de principios",
  "Innovación",
];

export default async function ReconocimientoPage() {
  const { employee } = await getSessionContext();
  const supabase = await createClient();
  const [{ data: recognitions }, { data: employees }] = await Promise.all([
    supabase.from("recognitions").select("*").order("date", { ascending: false }),
    supabase.from("employees").select("id, name"),
  ]);

  return (
    <ReconocimientoClient
      initialRecognitions={recognitions ?? []}
      employees={employees ?? []}
      currentEmployeeId={employee.id}
      badges={BADGES}
    />
  );
}
