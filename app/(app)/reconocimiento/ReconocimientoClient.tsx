"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FormModal, type Field } from "@/components/FormModal";
import { fmtDate } from "@/lib/format";

type Recognition = {
  id: string;
  from_id: string;
  to_id: string;
  badge: string | null;
  message: string | null;
  points: number | null;
  date: string | null;
};
type EmployeeRef = { id: string; name: string };

export function ReconocimientoClient({
  initialRecognitions,
  employees,
  currentEmployeeId,
  badges,
}: {
  initialRecognitions: Recognition[];
  employees: EmployeeRef[];
  currentEmployeeId: string;
  badges: string[];
}) {
  const [recognitions, setRecognitions] = useState(initialRecognitions);
  const [adding, setAdding] = useState(false);
  const supabase = createClient();

  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? "—";

  const totals: Record<string, number> = {};
  recognitions.forEach((r) => {
    totals[r.to_id] = (totals[r.to_id] ?? 0) + (r.points ?? 0);
  });

  const fields: Field[] = [
    { name: "to_id", label: "Para", type: "select", options: employees.filter((e) => e.id !== currentEmployeeId).map((e) => ({ value: e.id, label: e.name })) },
    { name: "badge", label: "Insignia", type: "select", options: badges.map((b) => ({ value: b, label: b })) },
    { name: "message", label: "Mensaje", type: "textarea" },
    { name: "points", label: "Puntos", type: "number", default: 25 },
    { name: "date", label: "Fecha", type: "date", default: new Date().toISOString().slice(0, 10) },
  ];

  async function handleSave(data: Record<string, string | number>) {
    const { error } = await supabase.from("recognitions").insert({ ...data, from_id: currentEmployeeId });
    if (error) {
      alert(error.message);
      return;
    }
    setAdding(false);
    const { data: refreshed } = await supabase.from("recognitions").select("*").order("date", { ascending: false });
    if (refreshed) setRecognitions(refreshed as Recognition[]);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("recognitions").delete().eq("id", id);
    if (!error) setRecognitions(recognitions.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="mb-3">
        <button onClick={() => setAdding(true)} className="bg-[#D9A441] text-[#3A2A0A] font-semibold text-sm rounded-md px-3.5 py-2">
          + Dar reconocimiento
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-[15px] mb-3" style={{ fontFamily: "Georgia, serif" }}>
            Muro de logros
          </h3>
          {recognitions.length ? (
            recognitions.map((r) => (
              <div key={r.id} className="border-b border-gray-100 last:border-0 py-2.5 text-sm">
                <span className="bg-[#F1E6CE] text-[#7A5A16] text-[11px] px-2.5 py-0.5 rounded-full font-semibold">{r.badge}</span>{" "}
                {empName(r.from_id)} → <strong>{empName(r.to_id)}</strong>
                <div>{r.message}</div>
                <div className="text-gray-500 text-[11.5px] mt-0.5 flex justify-between">
                  <span>
                    {fmtDate(r.date)} · +{r.points} pts
                  </span>
                  <button onClick={() => handleDelete(r.id)} className="text-gray-400 hover:text-[#B94A48]">
                    ✕
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 italic text-sm">Sin reconocimientos aún.</div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-[15px] mb-3" style={{ fontFamily: "Georgia, serif" }}>
            Puntos acumulados
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 border-b-2 border-gray-200">
                <th className="py-1.5 px-2">Colaborador</th>
                <th className="py-1.5 px-2">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(totals).length ? (
                Object.entries(totals)
                  .sort((a, b) => b[1] - a[1])
                  .map(([id, pts]) => (
                    <tr key={id} className="border-b border-gray-100 last:border-0">
                      <td className="py-1.5 px-2">{empName(id)}</td>
                      <td className="py-1.5 px-2">{pts}</td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={2} className="py-2 text-gray-400 italic">
                    Aún no hay puntos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {adding && <FormModal title="Dar reconocimiento" fields={fields} onSave={handleSave} onClose={() => setAdding(false)} />}
    </div>
  );
}
