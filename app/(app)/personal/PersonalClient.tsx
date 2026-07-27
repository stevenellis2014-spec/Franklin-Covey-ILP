"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormModal, type Field } from "@/components/FormModal";
import { Pill } from "@/components/Pill";
import { createDirectReport } from "./actions";

type OrgUnit = { id: string; name: string; parent_id: string | null };
type Employee = {
  id: string;
  name: string;
  email: string;
  pos: string | null;
  org_unit_id: string | null;
  hire_date: string | null;
  status: string;
};

function orgUnitOptions(orgUnits: OrgUnit[]) {
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

export function PersonalClient({ initialDirects, orgUnits }: { initialDirects: Employee[]; orgUnits: OrgUnit[] }) {
  const [directs, setDirects] = useState(initialDirects);
  const [editing, setEditing] = useState<Employee | "new" | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const orgName = (id: string | null) => orgUnits.find((u) => u.id === id)?.name ?? "Sin asignar";

  const fields: Field[] = [
    { name: "name", label: "Nombre completo" },
    { name: "email", label: "Correo electrónico", type: "email" },
    { name: "pos", label: "Puesto" },
    { name: "org_unit_id", label: "Unidad organizacional", type: "select", options: orgUnitOptions(orgUnits) },
    { name: "hire_date", label: "Fecha de ingreso", type: "date" },
    {
      name: "status",
      label: "Estado",
      type: "select",
      options: [
        { value: "active", label: "Activo" },
        { value: "on_leave", label: "De permiso" },
        { value: "terminated", label: "Inactivo" },
      ],
    },
  ];

  async function handleSave(data: Record<string, string | number>) {
    if (editing === "new") {
      const pw = prompt("Contraseña inicial para este colaborador (mínimo 8 caracteres):") ?? "";
      const result = await createDirectReport({
        name: String(data.name),
        email: String(data.email),
        pos: String(data.pos),
        org_unit_id: data.org_unit_id ? String(data.org_unit_id) : null,
        hire_date: String(data.hire_date || new Date().toISOString().slice(0, 10)),
        status: String(data.status),
        initialPassword: pw,
      });
      if (result.error) {
        alert(result.error);
        return;
      }
    } else if (editing) {
      const { error } = await supabase
        .from("employees")
        .update({
          name: data.name,
          email: data.email,
          pos: data.pos,
          org_unit_id: data.org_unit_id || null,
          hire_date: data.hire_date,
          status: data.status,
        })
        .eq("id", editing.id);
      if (error) {
        alert(error.message);
        return;
      }
    }
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este colaborador?")) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (!error) setDirects(directs.filter((e) => e.id !== id));
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        Los colaboradores que crees aquí quedarán asignados directamente a tu equipo. Solo el
        Administrador puede cambiar su rol.
      </p>
      <div className="mb-3">
        <button onClick={() => setEditing("new")} className="bg-[#1B3A4B] text-white font-semibold text-sm rounded-md px-3.5 py-2">
          + Nuevo colaborador
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 border-b-2 border-gray-200">
              <th className="py-1.5 px-2">Nombre</th>
              <th className="py-1.5 px-2">Correo</th>
              <th className="py-1.5 px-2">Puesto</th>
              <th className="py-1.5 px-2">Unidad organizacional</th>
              <th className="py-1.5 px-2">Estado</th>
              <th className="py-1.5 px-2" />
            </tr>
          </thead>
          <tbody>
            {directs.length ? (
              directs.map((e) => (
                <tr key={e.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 px-2">{e.name}</td>
                  <td className="py-2 px-2">{e.email || "—"}</td>
                  <td className="py-2 px-2">{e.pos}</td>
                  <td className="py-2 px-2">{orgName(e.org_unit_id)}</td>
                  <td className="py-2 px-2">
                    <Pill status={e.status} />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button onClick={() => setEditing(e)} className="text-gray-500 hover:text-[#1B3A4B] mr-2">
                      ✎
                    </button>
                    <button onClick={() => handleDelete(e.id)} className="text-gray-500 hover:text-[#B94A48]">
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-400 italic">
                  Aún no tienes colaboradores directos. Agrega el primero.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <FormModal
          title={editing === "new" ? "Nuevo colaborador" : "Editar colaborador"}
          fields={fields}
          initial={editing === "new" ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
