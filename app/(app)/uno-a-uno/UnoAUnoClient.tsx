"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FormModal, type Field } from "@/components/FormModal";
import { Pill } from "@/components/Pill";
import { fmtDate } from "@/lib/format";

type Agreement = { description: string; dueDate?: string; status: string };
type OneOnOne = {
  id: string;
  leader_id: string;
  collaborator_id: string;
  date: string | null;
  notes: string | null;
  agreements: Agreement[];
};
type EmployeeRef = { id: string; name: string };

export function UnoAUnoClient({ initialOneOnOnes, employees }: { initialOneOnOnes: OneOnOne[]; employees: EmployeeRef[] }) {
  const [list, setList] = useState(initialOneOnOnes);
  const [adding, setAdding] = useState(false);
  const [addingAgreementFor, setAddingAgreementFor] = useState<string | null>(null);
  const supabase = createClient();

  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? "—";

  async function refresh() {
    const { data } = await supabase.from("one_on_ones").select("*").order("date", { ascending: false });
    if (data) setList(data as OneOnOne[]);
  }

  const fields: Field[] = [
    { name: "leader_id", label: "Líder", type: "select", options: employees.map((e) => ({ value: e.id, label: e.name })) },
    { name: "collaborator_id", label: "Colaborador", type: "select", options: employees.map((e) => ({ value: e.id, label: e.name })) },
    { name: "date", label: "Fecha", type: "date" },
    { name: "notes", label: "Notas de la reunión", type: "textarea" },
  ];

  async function handleSave(data: Record<string, string | number>) {
    const { error } = await supabase.from("one_on_ones").insert({ ...data, agreements: [] });
    if (error) {
      alert(error.message);
      return;
    }
    setAdding(false);
    await refresh();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("one_on_ones").delete().eq("id", id);
    if (!error) setList(list.filter((o) => o.id !== id));
  }

  const agreementFields: Field[] = [
    { name: "description", label: "Descripción" },
    { name: "dueDate", label: "Fecha límite", type: "date" },
  ];

  async function handleAddAgreement(data: Record<string, string | number>) {
    if (!addingAgreementFor) return;
    const o = list.find((x) => x.id === addingAgreementFor);
    if (!o) return;
    const agreements = [...o.agreements, { description: String(data.description), dueDate: String(data.dueDate), status: "open" }];
    const { error } = await supabase.from("one_on_ones").update({ agreements }).eq("id", o.id);
    if (error) {
      alert(error.message);
      return;
    }
    setAddingAgreementFor(null);
    await refresh();
  }

  return (
    <div>
      <div className="mb-3">
        <button onClick={() => setAdding(true)} className="bg-[#1B3A4B] text-white font-semibold text-sm rounded-md px-3.5 py-2">
          + Nueva reunión individual
        </button>
      </div>
      {list.length ? (
        list.map((o) => (
          <div key={o.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
            <h3 className="font-semibold text-[15px] mb-1" style={{ fontFamily: "Georgia, serif" }}>
              {empName(o.leader_id)} ↔ {empName(o.collaborator_id)}
            </h3>
            <div className="text-xs text-gray-500 mb-2.5">{fmtDate(o.date)}</div>
            <div className="text-sm mb-2.5">{o.notes}</div>
            <table className="w-full text-sm mb-2.5">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 border-b-2 border-gray-200">
                  <th className="py-1.5 px-2">Acuerdo</th>
                  <th className="py-1.5 px-2">Fecha límite</th>
                  <th className="py-1.5 px-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {o.agreements.length ? (
                  o.agreements.map((a, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-1.5 px-2">{a.description}</td>
                      <td className="py-1.5 px-2">{fmtDate(a.dueDate)}</td>
                      <td className="py-1.5 px-2">
                        <Pill status={a.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-2 text-gray-400 italic">
                      Sin acuerdos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex gap-2">
              <button onClick={() => setAddingAgreementFor(o.id)} className="border border-gray-200 rounded-md px-3 py-1.5 text-[12.5px] text-[#1B3A4B]">
                + Acuerdo
              </button>
              <button onClick={() => handleDelete(o.id)} className="border border-gray-200 rounded-md px-3 py-1.5 text-[12.5px] text-[#B94A48]">
                Eliminar
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-400 italic">
          Sin reuniones individuales registradas.
        </div>
      )}

      {adding && <FormModal title="Nueva reunión individual" fields={fields} onSave={handleSave} onClose={() => setAdding(false)} />}
      {addingAgreementFor && (
        <FormModal title="Nuevo acuerdo" fields={agreementFields} onSave={handleAddAgreement} onClose={() => setAddingAgreementFor(null)} />
      )}
    </div>
  );
}
