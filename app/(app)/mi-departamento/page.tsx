import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { OrgChart } from "@/components/OrgChart";

export default async function MiDepartamentoPage() {
  const { role, employee } = await getSessionContext();
  if (role !== "gerente") redirect("/dashboard");

  if (!employee.org_unit_id) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-400 italic">
        Tu usuario todavía no tiene una unidad organizacional asignada. Pídele al Administrador que te
        asigne una para poder construir aquí tu departamento.
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: orgUnits }, { data: employees }] = await Promise.all([
    supabase.from("org_units").select("*"),
    supabase.from("employees").select("id, name, org_unit_id"),
  ]);

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        Construye la estructura de tu propio departamento — agrega los puestos y equipos que te
        reportan. Queda reflejado también en el organigrama institucional que ve el Administrador.
      </p>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <OrgChart
          initialOrgUnits={orgUnits ?? []}
          employees={employees ?? []}
          rootId={employee.org_unit_id}
          protectedRootId={employee.org_unit_id}
        />
      </div>
    </div>
  );
}
