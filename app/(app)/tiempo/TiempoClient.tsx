"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FormModal, type Field } from "@/components/FormModal";
import { fmtDate } from "@/lib/format";

type Task = {
  id: string;
  employee_id: string;
  title: string;
  quadrant: number;
  due_date: string | null;
  status: string;
  week: string | null;
};
type EmployeeRef = { id: string; name: string };

const QUADRANTS = [
  { n: 1, label: "I · Urgente e importante", bg: "#FBECEA" },
  { n: 2, label: "II · Importante, no urgente", bg: "#EAF4EE" },
  { n: 3, label: "III · Urgente, no importante", bg: "#FCF2E4" },
  { n: 4, label: "IV · Ni urgente ni importante", bg: "#F1EEE6" },
];

export function TiempoClient({
  initialTasks,
  employees,
  currentEmployeeId,
  scoped,
  week,
}: {
  initialTasks: Task[];
  employees: EmployeeRef[];
  currentEmployeeId: string;
  scoped: boolean;
  week: string;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [empFilter, setEmpFilter] = useState("");
  const [adding, setAdding] = useState(false);
  const supabase = createClient();

  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? "—";

  const scope = scoped ? tasks : tasks.filter((t) => t.employee_id === currentEmployeeId);
  const visible = scope.filter((t) => !scoped || !empFilter || t.employee_id === empFilter);

  const fields: Field[] = [
    { name: "title", label: "Tarea" },
    {
      name: "employee_id",
      label: "Colaborador",
      type: "select",
      options: scoped ? employees.map((e) => ({ value: e.id, label: e.name })) : [{ value: currentEmployeeId, label: empName(currentEmployeeId) }],
      default: currentEmployeeId,
    },
    {
      name: "quadrant",
      label: "Cuadrante",
      type: "select",
      options: [
        { value: "1", label: "I — Urgente e importante" },
        { value: "2", label: "II — Importante, no urgente" },
        { value: "3", label: "III — Urgente, no importante" },
        { value: "4", label: "IV — Ninguna" },
      ],
    },
    { name: "due_date", label: "Fecha límite", type: "date" },
    { name: "week", label: "Semana", default: week },
  ];

  async function handleSave(data: Record<string, string | number>) {
    const { error } = await supabase.from("tasks").insert({ ...data, quadrant: Number(data.quadrant), status: "pending" });
    if (error) {
      alert(error.message);
      return;
    }
    setAdding(false);
    const { data: refreshed } = await supabase.from("tasks").select("*");
    if (refreshed) setTasks(refreshed as Task[]);
  }

  async function toggleTask(t: Task) {
    const status = t.status === "done" ? "pending" : "done";
    const { error } = await supabase.from("tasks").update({ status }).eq("id", t.id);
    if (!error) setTasks(tasks.map((x) => (x.id === t.id ? { ...x, status } : x)));
  }

  async function deleteTask(id: string) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) setTasks(tasks.filter((t) => t.id !== id));
  }

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        {scoped && (
          <select value={empFilter} onChange={(e) => setEmpFilter(e.target.value)} className="px-2.5 py-1.5 border border-gray-200 rounded-md text-[12.5px]">
            <option value="">Todo mi equipo</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        )}
        <button onClick={() => setAdding(true)} className="bg-[#1B3A4B] text-white font-semibold text-sm rounded-md px-3.5 py-2">
          + Nueva tarea
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {QUADRANTS.map((q) => (
          <div key={q.n} className="rounded-lg p-3 min-h-[120px]" style={{ background: q.bg }}>
            <h4 className="text-[12.5px] font-semibold mb-2" style={{ fontFamily: "Georgia, serif" }}>
              {q.label}
            </h4>
            {visible.filter((t) => t.quadrant === q.n).length ? (
              visible
                .filter((t) => t.quadrant === q.n)
                .map((t) => (
                  <div
                    key={t.id}
                    className={`bg-white rounded-md px-2.5 py-1.5 text-[12.5px] mb-1.5 flex justify-between items-center gap-1.5 ${
                      t.status === "done" ? "opacity-55 line-through" : ""
                    }`}
                  >
                    <span>
                      {t.title}{" "}
                      <span className="text-gray-400 text-[11px]">
                        {scoped ? `(${empName(t.employee_id)}, ${fmtDate(t.due_date)})` : `(${fmtDate(t.due_date)})`}
                      </span>
                    </span>
                    <span className="flex gap-1 shrink-0">
                      <button onClick={() => toggleTask(t)} className="text-gray-500 hover:text-[#1B3A4B]">
                        {t.status === "done" ? "↺" : "✓"}
                      </button>
                      <button onClick={() => deleteTask(t.id)} className="text-gray-500 hover:text-[#B94A48]">
                        ✕
                      </button>
                    </span>
                  </div>
                ))
            ) : (
              <div className="text-gray-400 italic text-[12px]">Sin tareas.</div>
            )}
          </div>
        ))}
      </div>

      {adding && <FormModal title="Nueva tarea" fields={fields} onSave={handleSave} onClose={() => setAdding(false)} />}
    </div>
  );
}
