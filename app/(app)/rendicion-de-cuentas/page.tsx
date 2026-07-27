import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { currentIsoWeek } from "@/lib/format";
import { ColaboradorWizard } from "./ColaboradorWizard";
import { GerenteView } from "./GerenteView";

export default async function RendicionDeCuentasPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { employee, role } = await getSessionContext();
  const supabase = await createClient();
  const params = await searchParams;
  const week = params.week || currentIsoWeek();

  if (role === "colaborador") {
    const { data: report } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("week", week)
      .maybeSingle();

    return <ColaboradorWizard employeeId={employee.id} week={week} initialReport={report ?? null} />;
  }

  const { data: directs } = await supabase.from("employees").select("id, name, email").eq("manager_id", employee.id);
  const directIds = (directs ?? []).map((d) => d.id);

  const { data: reports } = await supabase
    .from("weekly_reports")
    .select("*")
    .eq("week", week)
    .in("employee_id", directIds.length ? directIds : ["00000000-0000-0000-0000-000000000000"]);

  const { data: weekCommitments } = await supabase
    .from("commitments")
    .select("*")
    .eq("week", week)
    .in("employee_id", directIds.length ? directIds : ["00000000-0000-0000-0000-000000000000"]);

  const { data: allCommitments } = await supabase
    .from("commitments")
    .select("*")
    .in("employee_id", directIds.length ? directIds : ["00000000-0000-0000-0000-000000000000"]);

  return (
    <GerenteView
      week={week}
      leaderName={employee.name}
      directs={directs ?? []}
      reports={reports ?? []}
      weekCommitments={weekCommitments ?? []}
      allCommitments={allCommitments ?? []}
      emailEnabled={Boolean(process.env.RESEND_API_KEY)}
    />
  );
}
