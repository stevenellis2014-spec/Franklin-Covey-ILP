import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { DesempenoClient } from "./DesempenoClient";

export default async function DesempenoPage() {
  await getSessionContext();
  const supabase = await createClient();
  const [{ data: evaluations }, { data: employees }] = await Promise.all([
    supabase.from("evaluations").select("*").order("cycle", { ascending: false }),
    supabase.from("employees").select("id, name"),
  ]);

  return <DesempenoClient initialEvaluations={evaluations ?? []} employees={employees ?? []} />;
}
