"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormModal, type Field } from "@/components/FormModal";
import { Pill } from "@/components/Pill";

type Evaluation = {
  id: string;
  employee_id: string;
  evaluator: string | null;
  type: string | null;
  cycle: string | null;
  scores: { name: string; score: number }[];
  comment: string | null;
  status: string;
};
type EmployeeRef = { id: string; name: string };

export function DesempenoClient({
  initialEvaluations,
  employees,
}: {
  initialEvaluations: Evaluation[];
  employees: EmployeeRef[];
}) {
  const [evaluations, setEvaluations] = useState(initialEvaluations);
  const [adding, setAdding] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? "—";

  const fields: Field[] = [
    { name: "employee_id", label: "Colaborador evaluado", type: "select", options: employees.map((e) => ({ value: e.id, label: e.name })) },
    { name: "evaluator", label: "Evaluador" },
    {
      name: "type",
      label: "Tipo",
      type: "select",
      options: [
        { value: "90", label: "90°" },
        { value: "180", label: "180°" },
        { value: "360", label: "360°" },
      ],
    },
    { name: "cycle", label: "Ciclo (ej. 2026-S2)" },
    { name: "competencyName", label: "Competencia principal" },
    { name: "competencyScore", label: "Puntaje (1-5)", type: "number" },
    { name: "comment", label: "Retroalimentación / comentario", type: "textarea" },
    {
      name: "status",
      label: "Estado",
      type: "select",
      options: [
        { value: "pending", label: "Pendiente" },
        { value: "completed", label: "Completado" },
      ],
    },
  ];

  async function handleSave(data: Record<string, string | number>) {
    const { error } = await supabase.from("evaluations").insert({
      employee_id: data.employee_id,
      evaluator: data.evaluator,
      type: data.type,
      cycle: data.cycle,
      scores: [{ name: data.competencyName, score: data.competencyScore }],
      comment: data.comment,
      status: data.status,
    });
    if (error) {
      alert(error.message);
      return;
    }
    setAdding(false);
    router.refresh();
    const { data: refreshed } = await supabase.from("evaluations").select("*").order("cycle", { ascending: false });
    if (refreshed) setEvaluations(refreshed as Evaluation[]);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("evaluations").delete().eq("id", id);
    if (!error) setEvaluations(evaluations.filter((e) => e.id !== id));
  }

  return (
    <div>
      <div className="mb-3">
        <button onClick={() => setAdding(true)} className="bg-[#1B3A4B] text-white font-semibold text-sm rounded-md px-3.5 py-2">
          + Nueva evaluación
        </button>
      </div>
      {evaluations.length ? (
        evaluations.map((ev) => (
          <div key={ev.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
            <h3 className="font-semibold text-[15px] mb-1 flex items-center gap-2" style={{ fontFamily: "Georgia, serif" }}>
              {empName(ev.employee_id)} <Pill status={ev.status} />
            </h3>
            <div className="text-xs text-gray-500 mb-2.5">
              Evaluación {ev.type}° · Evaluador: {ev.evaluator} · Ciclo: {ev.cycle}
            </div>
            <table className="w-full text-sm mb-2.5">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 border-b-2 border-gray-200">
                  <th className="py-1.5 px-2">Competencia</th>
                  <th className="py-1.5 px-2">Puntaje</th>
                </tr>
              </thead>
              <tbody>
                {ev.scores.map((s, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-1.5 px-2">{s.name}</td>
                    <td className="py-1.5 px-2">{s.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs text-gray-500 mb-2.5">Retroalimentación: {ev.comment}</div>
            <button onClick={() => handleDelete(ev.id)} className="border border-gray-200 rounded-md px-3 py-1.5 text-[12.5px] text-[#B94A48]">
              Eliminar
            </button>
          </div>
        ))
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-400 italic">
          Sin evaluaciones registradas para tu equipo.
        </div>
      )}

      {adding && <FormModal title="Nueva evaluación" fields={fields} onSave={handleSave} onClose={() => setAdding(false)} />}
    </div>
  );
}
