import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { UnoAUnoClient } from "./UnoAUnoClient";

export default async function UnoAUnoPage() {
  await getSessionContext();
  const supabase = await createClient();
  const [{ data: oneOnOnes }, { data: employees }] = await Promise.all([
    supabase.from("one_on_ones").select("*").order("date", { ascending: false }),
    supabase.from("employees").select("id, name"),
  ]);

  return <UnoAUnoClient initialOneOnOnes={oneOnOnes ?? []} employees={employees ?? []} />;
}
