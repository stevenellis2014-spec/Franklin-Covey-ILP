import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { OrgChart } from "@/components/OrgChart";

export default async function AdminOrganigramaPage() {
  const { role } = await getSessionContext();
  if (role !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: orgUnits }, { data: employees }] = await Promise.all([
    supabase.from("org_units").select("*"),
    supabase.from("employees").select("id, name, org_unit_id"),
  ]);

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        Organigrama institucional de Industria La Popular. Marca &quot;Regional&quot; en un puesto para
        llevar su propia estructura de países por separado — haz clic en &quot;Ver estructura
        regional&quot; para entrar a administrarla.
      </p>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <OrgChart
          initialOrgUnits={orgUnits ?? []}
          employees={employees ?? []}
          rootId={null}
          protectedRootId={null}
        />
      </div>
    </div>
  );
}
