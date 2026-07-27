"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FormModal, type Field } from "@/components/FormModal";
import { Pill } from "@/components/Pill";

type Course = { title: string; status: string };
type Plan = {
  id: string;
  employee_id: string;
  year: number | null;
  focus_area: string | null;
  courses: Course[];
};
type EmployeeRef = { id: string; name: string };

export function DesarrolloClient({
  initialPlans,
  employees,
  currentEmployeeId,
  scoped,
}: {
  initialPlans: Plan[];
  employees: EmployeeRef[];
  currentEmployeeId: string;
  scoped: boolean;
}) {
  const [plans, setPlans] = useState(initialPlans);
  const [adding, setAdding] = useState(false);
  const [addingCourseFor, setAddingCourseFor] = useState<string | null>(null);
  const supabase = createClient();

  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? "—";

  async function refresh() {
    const { data } = await supabase.from("development_plans").select("*").order("year", { ascending: false });
    if (data) setPlans(data as Plan[]);
  }

  const fields: Field[] = [
    {
      name: "employee_id",
      label: "Colaborador",
      type: "select",
      options: scoped ? employees.map((e) => ({ value: e.id, label: e.name })) : [{ value: currentEmployeeId, label: empName(currentEmployeeId) }],
      default: currentEmployeeId,
    },
    { name: "year", label: "Año", type: "number", default: new Date().getFullYear() },
    { name: "focus_area", label: "Área de enfoque" },
  ];

  async function handleSave(data: Record<string, string | number>) {
    const { error } = await supabase.from("development_plans").insert({ ...data, courses: [] });
    if (error) {
      alert(error.message);
      return;
    }
    setAdding(false);
    await refresh();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("development_plans").delete().eq("id", id);
    if (!error) setPlans(plans.filter((p) => p.id !== id));
  }

  const courseFields: Field[] = [
    { name: "title", label: "Nombre del curso/certificación" },
    {
      name: "status",
      label: "Estado",
      type: "select",
      options: [
        { value: "enrolled", label: "Inscrito" },
        { value: "in_progress", label: "En curso" },
        { value: "completed", label: "Completado" },
      ],
    },
  ];

  async function handleAddCourse(data: Record<string, string | number>) {
    if (!addingCourseFor) return;
    const p = plans.find((x) => x.id === addingCourseFor);
    if (!p) return;
    const courses = [...p.courses, { title: String(data.title), status: String(data.status) }];
    const { error } = await supabase.from("development_plans").update({ courses }).eq("id", p.id);
    if (error) {
      alert(error.message);
      return;
    }
    setAddingCourseFor(null);
    await refresh();
  }

  return (
    <div>
      <div className="mb-3">
        <button onClick={() => setAdding(true)} className="bg-[#1B3A4B] text-white font-semibold text-sm rounded-md px-3.5 py-2">
          + Nuevo PID
        </button>
      </div>
      {plans.length ? (
        plans.map((p) => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
            <h3 className="font-semibold text-[15px] mb-1" style={{ fontFamily: "Georgia, serif" }}>
              {empName(p.employee_id)} — PID {p.year}
            </h3>
            <div className="text-xs text-gray-500 mb-2.5">Área de enfoque: {p.focus_area}</div>
            <table className="w-full text-sm mb-2.5">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 border-b-2 border-gray-200">
                  <th className="py-1.5 px-2">Curso / certificación</th>
                  <th className="py-1.5 px-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {p.courses.length ? (
                  p.courses.map((c, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-1.5 px-2">{c.title}</td>
                      <td className="py-1.5 px-2">
                        <Pill status={c.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-2 text-gray-400 italic">
                      Sin cursos aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex gap-2">
              <button onClick={() => setAddingCourseFor(p.id)} className="border border-gray-200 rounded-md px-3 py-1.5 text-[12.5px] text-[#1B3A4B]">
                + Curso
              </button>
              <button onClick={() => handleDelete(p.id)} className="border border-gray-200 rounded-md px-3 py-1.5 text-[12.5px] text-[#B94A48]">
                Eliminar
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-400 italic">
          Sin planes de desarrollo registrados.
        </div>
      )}

      {adding && <FormModal title="Nuevo PID" fields={fields} onSave={handleSave} onClose={() => setAdding(false)} />}
      {addingCourseFor && (
        <FormModal title="Agregar curso" fields={courseFields} onSave={handleAddCourse} onClose={() => setAddingCourseFor(null)} />
      )}
    </div>
  );
}
