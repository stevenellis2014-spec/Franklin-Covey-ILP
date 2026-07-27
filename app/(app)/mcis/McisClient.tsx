"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormModal, type Field } from "@/components/FormModal";
import { Pill, ProgressBar } from "@/components/Pill";
import { mciProgress } from "@/lib/format";
import type { AccessLevel } from "@/lib/session";

type Mci = {
  id: string;
  parent_mci_id: string | null;
  title: string;
  statement: string | null;
  level: string;
  owner_id: string | null;
  org_unit_id: string | null;
  baseline: number | null;
  target: number | null;
  current_value: number | null;
  uom: string | null;
  start_date: string | null;
  target_date: string | null;
  status: string;
};
type LeadMeasure = {
  id: string;
  mci_id: string;
  title: string;
  measure_type: string | null;
  target: number | null;
  cadence: string | null;
  responsible_id: string | null;
};
type EmployeeRef = { id: string; name: string };
type OrgUnitRef = { id: string; name: string; parent_id: string | null };

function orgUnitOptions(orgUnits: OrgUnitRef[]) {
  const result = [{ value: "", label: "— Sin asignar —" }];
  function walk(parentId: string | null, depth: number) {
    orgUnits
      .filter((u) => u.parent_id === parentId)
      .forEach((u) => {
        result.push({ value: u.id, label: " ".repeat(depth) + u.name });
        walk(u.id, depth + 1);
      });
  }
  walk(null, 0);
  return result;
}
function orgUnitPath(orgUnits: OrgUnitRef[], id: string | null) {
  if (!id) return "Sin asignar";
  const path: string[] = [];
  let cur = orgUnits.find((u) => u.id === id) ?? null;
  while (cur) {
    path.unshift(cur.name);
    cur = cur.parent_id ? orgUnits.find((u) => u.id === cur!.parent_id) ?? null : null;
  }
  return path.join(" › ") || "Sin asignar";
}

export function McisClient({
  initialMcis,
  initialLeadMeasures,
  employees,
  orgUnits,
  currentEmployeeId,
  role,
}: {
  initialMcis: Mci[];
  initialLeadMeasures: LeadMeasure[];
  employees: EmployeeRef[];
  orgUnits: OrgUnitRef[];
  currentEmployeeId: string;
  role: AccessLevel;
}) {
  const [mcis, setMcis] = useState(initialMcis);
  const [leadMeasures, setLeadMeasures] = useState(initialLeadMeasures);
  const [levelFilter, setLevelFilter] = useState("");
  const [editingMci, setEditingMci] = useState<Mci | "new" | null>(null);
  const [addingLm, setAddingLm] = useState<string | null>(null);
  const [reportingLm, setReportingLm] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const empName = (id: string | null) => employees.find((e) => e.id === id)?.name ?? "—";

  const list = mcis.filter((w) => !levelFilter || w.level === levelFilter);

  const mciFields: Field[] = [
    { name: "title", label: "Título de la MCI" },
    { name: "statement", label: "Enunciado (de X a Y para fecha Z)", type: "textarea" },
    {
      name: "level",
      label: "Nivel",
      type: "select",
      options: [
        { value: "corporate", label: "Corporativa" },
        { value: "department", label: "Departamental" },
        { value: "individual", label: "Individual" },
      ],
    },
    { name: "org_unit_id", label: "Unidad organizacional", type: "select", options: orgUnitOptions(orgUnits) },
    {
      name: "owner_id",
      label: "Dueño",
      type: "select",
      options:
        role === "colaborador"
          ? [{ value: currentEmployeeId, label: empName(currentEmployeeId) }]
          : employees.map((e) => ({ value: e.id, label: e.name })),
      default: currentEmployeeId,
    },
    { name: "baseline", label: "Valor de línea base", type: "number" },
    { name: "target", label: "Valor meta", type: "number" },
    { name: "current_value", label: "Valor actual", type: "number" },
    { name: "uom", label: "Unidad de medida (%, unidades, etc.)" },
    { name: "start_date", label: "Fecha de inicio", type: "date" },
    { name: "target_date", label: "Fecha meta", type: "date" },
    {
      name: "status",
      label: "Estado",
      type: "select",
      options: [
        { value: "on_track", label: "En curso" },
        { value: "at_risk", label: "En riesgo" },
        { value: "off_track", label: "Fuera de meta" },
        { value: "achieved", label: "Alcanzada" },
      ],
    },
  ];

  async function refresh() {
    const [{ data: m }, { data: lm }] = await Promise.all([
      supabase.from("mcis").select("*").order("level"),
      supabase.from("lead_measures").select("*"),
    ]);
    if (m) setMcis(m as Mci[]);
    if (lm) setLeadMeasures(lm as LeadMeasure[]);
    router.refresh();
  }

  async function handleSaveMci(data: Record<string, string | number>) {
    const payload = { ...data, org_unit_id: data.org_unit_id || null };
    if (editingMci === "new") {
      const { error } = await supabase.from("mcis").insert(payload);
      if (error) {
        alert(error.message);
        return;
      }
    } else if (editingMci) {
      const { error } = await supabase.from("mcis").update(payload).eq("id", editingMci.id);
      if (error) {
        alert(error.message);
        return;
      }
    }
    setEditingMci(null);
    await refresh();
  }

  async function handleDeleteMci(id: string) {
    if (!confirm("¿Eliminar esta MCI y sus indicadores?")) return;
    await supabase.from("lead_measures").delete().eq("mci_id", id);
    const { error } = await supabase.from("mcis").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    await refresh();
  }

  const lmFields: Field[] = [
    { name: "title", label: "Título del indicador" },
    {
      name: "measure_type",
      label: "Tipo",
      type: "select",
      options: [
        { value: "lead", label: "Lead (predictivo)" },
        { value: "lag", label: "Lag (resultado)" },
      ],
    },
    { name: "target", label: "Meta", type: "number" },
    {
      name: "cadence",
      label: "Cadencia",
      type: "select",
      options: [
        { value: "weekly", label: "Semanal" },
        { value: "biweekly", label: "Quincenal" },
        { value: "monthly", label: "Mensual" },
      ],
    },
    { name: "responsible_id", label: "Responsable", type: "select", options: employees.map((e) => ({ value: e.id, label: e.name })) },
  ];

  async function handleSaveLm(data: Record<string, string | number>) {
    if (!addingLm) return;
    const { error } = await supabase.from("lead_measures").insert({ ...data, mci_id: addingLm });
    if (error) {
      alert(error.message);
      return;
    }
    setAddingLm(null);
    await refresh();
  }

  const reportFields: Field[] = [
    { name: "week", label: "Semana (ej. 2026-W30)" },
    { name: "value", label: "Valor reportado", type: "number" },
    {
      name: "reported_by",
      label: "Reportado por",
      type: "select",
      options: employees.map((e) => ({ value: e.id, label: e.name })),
      default: currentEmployeeId,
    },
  ];

  async function handleSaveReport(data: Record<string, string | number>) {
    if (!reportingLm) return;
    const { error } = await supabase.from("measure_entries").insert({ ...data, lead_measure_id: reportingLm });
    if (error) {
      alert(error.message);
      return;
    }
    const lm = leadMeasures.find((x) => x.id === reportingLm);
    if (lm) {
      await supabase.from("mcis").update({ current_value: data.value }).eq("id", lm.mci_id);
    }
    setReportingLm(null);
    await refresh();
  }

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-200 rounded-md text-[12.5px]"
        >
          <option value="">Todos los niveles</option>
          <option value="corporate">Corporativa</option>
          <option value="department">Departamental</option>
          <option value="individual">Individual</option>
        </select>
        <button
          onClick={() => setEditingMci("new")}
          className="bg-[#1B3A4B] text-white font-semibold text-sm rounded-md px-3.5 py-2"
        >
          + Nueva MCI
        </button>
      </div>

      {list.length ? (
        list.map((w) => {
          const lms = leadMeasures.filter((lm) => lm.mci_id === w.id);
          return (
            <div key={w.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-[15px] mb-1 flex items-center gap-2" style={{ fontFamily: "Georgia, serif" }}>
                {w.title} <Pill status={w.status} />
              </h3>
              <div className="text-xs text-gray-500 mb-2.5">
                {w.statement} — Nivel:{" "}
                {w.level === "corporate" ? "Corporativa" : w.level === "department" ? "Departamental" : "Individual"} ·
                Unidad: {orgUnitPath(orgUnits, w.org_unit_id)} · Dueño: {empName(w.owner_id)}
              </div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <ProgressBar percent={mciProgress(w)} status={w.status} />
                <span className="font-mono text-sm whitespace-nowrap">
                  {w.current_value ?? 0}
                  {w.uom} / {w.target ?? 0}
                  {w.uom}
                </span>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full text-sm mb-2.5">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 border-b-2 border-gray-200">
                    <th className="py-1.5 px-2">Indicador (lead/lag)</th>
                    <th className="py-1.5 px-2">Cadencia</th>
                    <th className="py-1.5 px-2">Meta</th>
                    <th className="py-1.5 px-2">Responsable</th>
                    <th className="py-1.5 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {lms.length ? (
                    lms.map((lm) => (
                      <tr key={lm.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-1.5 px-2">{lm.title}</td>
                        <td className="py-1.5 px-2">{lm.cadence}</td>
                        <td className="py-1.5 px-2">{lm.target}</td>
                        <td className="py-1.5 px-2">{empName(lm.responsible_id)}</td>
                        <td className="py-1.5 px-2">
                          <button
                            onClick={() => setReportingLm(lm.id)}
                            className="text-[#1B3A4B] underline text-[12.5px] font-semibold"
                          >
                            Reportar avance
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-2 text-gray-400 italic">
                        Sin indicadores aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAddingLm(w.id)} className="border border-gray-200 rounded-md px-3 py-1.5 text-[12.5px] text-[#1B3A4B]">
                  + Indicador
                </button>
                <button onClick={() => setEditingMci(w)} className="border border-gray-200 rounded-md px-3 py-1.5 text-[12.5px] text-[#1B3A4B]">
                  Editar MCI
                </button>
                <button onClick={() => handleDeleteMci(w.id)} className="border border-gray-200 rounded-md px-3 py-1.5 text-[12.5px] text-[#B94A48]">
                  Eliminar
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-400 italic">
          No hay MCIs para este filtro. Crea la primera.
        </div>
      )}

      {editingMci && (
        <FormModal
          title={editingMci === "new" ? "Nueva MCI" : "Editar MCI"}
          fields={mciFields}
          initial={editingMci === "new" ? null : editingMci}
          onSave={handleSaveMci}
          onClose={() => setEditingMci(null)}
        />
      )}
      {addingLm && (
        <FormModal title="Nuevo indicador" fields={lmFields} onSave={handleSaveLm} onClose={() => setAddingLm(null)} />
      )}
      {reportingLm && (
        <FormModal title="Reportar avance" fields={reportFields} onSave={handleSaveReport} onClose={() => setReportingLm(null)} />
      )}
    </div>
  );
}
