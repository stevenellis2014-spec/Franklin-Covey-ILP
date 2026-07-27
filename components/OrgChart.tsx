"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormModal, type Field } from "@/components/FormModal";

export type OrgUnit = {
  id: string;
  parent_id: string | null;
  name: string;
  type: string;
  is_regional: boolean;
};
export type EmployeeRef = { id: string; name: string; org_unit_id: string | null };

const TYPE_OPTIONS = [
  "Gerencia General",
  "Departamento",
  "Puesto",
  "País",
  "Área funcional",
  "Coordinación regional",
  "Equipo",
  "Otro",
];

export function OrgChart({
  initialOrgUnits,
  employees,
  rootId,
  protectedRootId,
}: {
  initialOrgUnits: OrgUnit[];
  employees: EmployeeRef[];
  rootId: string | null;
  protectedRootId: string | null;
}) {
  const [orgUnits, setOrgUnits] = useState(initialOrgUnits);
  const [drillDownId, setDrillDownId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ existing: OrgUnit | null; parentId: string | null } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function occupants(unitId: string) {
    return employees.filter((e) => e.org_unit_id === unitId).map((e) => e.name);
  }
  function children(parentId: string | null) {
    return orgUnits.filter((u) => u.parent_id === parentId);
  }

  async function refresh() {
    const { data } = await supabase.from("org_units").select("*");
    if (data) setOrgUnits(data as OrgUnit[]);
    router.refresh();
  }

  async function handleSave(data: Record<string, string | number>) {
    if (!modal) return;
    if (modal.existing) {
      const { error } = await supabase
        .from("org_units")
        .update({ name: data.name, type: data.type })
        .eq("id", modal.existing.id);
      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("org_units").insert({
        name: data.name,
        type: data.type,
        parent_id: modal.parentId,
        is_regional: false,
      });
      if (error) {
        alert(error.message);
        return;
      }
    }
    setModal(null);
    await refresh();
  }

  async function handleToggleRegional(unit: OrgUnit) {
    const { error } = await supabase
      .from("org_units")
      .update({ is_regional: !unit.is_regional })
      .eq("id", unit.id);
    if (!error) await refresh();
  }

  async function handleDuplicate(unit: OrgUnit) {
    const { data, error } = await supabase
      .from("org_units")
      .insert({ name: `Copia de ${unit.name}`, type: unit.type, parent_id: unit.parent_id, is_regional: false })
      .select()
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    await refresh();
    if (data) setModal({ existing: data as OrgUnit, parentId: null });
  }

  async function handleDelete(unit: OrgUnit) {
    if (unit.id === protectedRootId) {
      alert("No puedes eliminar tu propio departamento desde aquí. Pídele al Administrador que lo reestructure.");
      return;
    }
    const hasChildren = orgUnits.some((u) => u.parent_id === unit.id);
    const hasEmployees = employees.some((e) => e.org_unit_id === unit.id);
    if (hasChildren) {
      alert("Esta unidad tiene sub-unidades. Elimina o reubica esas sub-unidades primero.");
      return;
    }
    if (hasEmployees && !confirm("Hay personas asignadas a esta unidad. Si la eliminas, quedarán sin unidad asignada. ¿Continuar?")) return;
    if (!hasEmployees && !confirm("¿Eliminar esta unidad organizacional?")) return;

    await supabase.from("employees").update({ org_unit_id: null }).eq("org_unit_id", unit.id);
    await supabase.from("mcis").update({ org_unit_id: null }).eq("org_unit_id", unit.id);
    const { error } = await supabase.from("org_units").delete().eq("id", unit.id);
    if (error) {
      alert(error.message);
      return;
    }
    if (drillDownId === unit.id) setDrillDownId(null);
    await refresh();
  }

  const fields: Field[] = [
    { name: "name", label: "Nombre" },
    { name: "type", label: "Tipo", type: "select", options: TYPE_OPTIONS.map((t) => ({ value: t, label: t })) },
  ];

  function OrgBox({ unit, isDrillRoot }: { unit: OrgUnit; isDrillRoot: boolean }) {
    const stopHere = unit.is_regional && !isDrillRoot;
    const occ = occupants(unit.id);
    const kids = stopHere ? [] : children(unit.id);
    const canDelete = unit.id !== protectedRootId;

    return (
      <div className="pl-4 border-l-2 border-gray-200 mt-2 first:mt-0 first:pl-0 first:border-l-0">
        <div className={`border rounded-lg p-3 w-[220px] bg-white ${unit.is_regional ? "border-[#D9A441] bg-[#FFFBF0]" : "border-gray-200"}`}>
          <div className="font-semibold text-[13px]">{unit.name}</div>
          <div className="text-[10.5px] text-gray-500 uppercase tracking-wide mb-1.5">{unit.type}</div>
          {occ.length > 0 && <div className="text-[11.5px] mb-1.5">{occ.join(", ")}</div>}
          <label className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1.5 cursor-pointer">
            <input type="checkbox" checked={unit.is_regional} onChange={() => handleToggleRegional(unit)} />
            Es un puesto Regional
          </label>
          {stopHere && (
            <button onClick={() => setDrillDownId(unit.id)} className="block text-[11px] text-[#1B3A4B] underline font-semibold mb-1.5">
              Ver estructura regional ({children(unit.id).length}) →
            </button>
          )}
          <div className="flex gap-2 justify-end border-t border-gray-100 pt-1.5 text-[11.5px] text-gray-500">
            <button onClick={() => setModal({ existing: null, parentId: unit.id })} title="Agregar sub-unidad" className="hover:text-[#1B3A4B]">
              +
            </button>
            <button onClick={() => handleDuplicate(unit)} title="Duplicar" className="hover:text-[#1B3A4B]">
              ⧉
            </button>
            <button onClick={() => setModal({ existing: unit, parentId: null })} title="Editar" className="hover:text-[#1B3A4B]">
              ✎
            </button>
            {canDelete && (
              <button onClick={() => handleDelete(unit)} title="Eliminar" className="hover:text-[#B94A48]">
                ✕
              </button>
            )}
          </div>
        </div>
        {!stopHere && (
          <div className="ml-2">
            {kids.map((k) => (
              <OrgBox key={k.id} unit={k} isDrillRoot={false} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const drillNode = drillDownId ? orgUnits.find((u) => u.id === drillDownId) : null;

  if (drillDownId && drillNode) {
    const node = drillNode;
    return (
      <div>
        <button onClick={() => setDrillDownId(null)} className="border border-gray-200 rounded-md px-3 py-1.5 text-[12.5px] mb-3">
          ← Volver
        </button>
        <p className="text-xs text-gray-500 mb-3">Estructura regional de &quot;{node.name}&quot;</p>
        <div className="overflow-x-auto">
          <OrgBox unit={node} isDrillRoot />
          <button
            onClick={() => setModal({ existing: null, parentId: node.id })}
            className="mt-2 border border-dashed border-gray-300 rounded-lg px-4 py-3 text-[12.5px] text-gray-500 hover:border-[#1B3A4B] hover:text-[#1B3A4B]"
          >
            + Agregar
          </button>
        </div>
        {modal && (
          <FormModal
            title={modal.existing ? "Editar unidad" : "Nueva unidad organizacional"}
            fields={fields}
            initial={modal.existing}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        )}
      </div>
    );
  }

  const roots = rootId ? orgUnits.filter((u) => u.id === rootId) : orgUnits.filter((u) => !u.parent_id);

  return (
    <div className="overflow-x-auto">
      {roots.map((r) => (
        <OrgBox key={r.id} unit={r} isDrillRoot={false} />
      ))}
      {!rootId && (
        <button
          onClick={() => setModal({ existing: null, parentId: null })}
          className="mt-2 border border-dashed border-gray-300 rounded-lg px-4 py-3 text-[12.5px] text-gray-500 hover:border-[#1B3A4B] hover:text-[#1B3A4B]"
        >
          + Agregar
        </button>
      )}
      {modal && (
        <FormModal
          title={modal.existing ? "Editar unidad" : "Nueva unidad organizacional"}
          fields={fields}
          initial={modal.existing}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
