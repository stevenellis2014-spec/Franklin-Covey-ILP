"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormModal, type Field } from "@/components/FormModal";

type Role = { id: string; name: string; access_level: string; description: string | null };
type EmployeeRef = { id: string; role_id: string };

const LEVEL_LABEL: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  colaborador: "Colaborador",
};

export function RolesClient({
  initialRoles,
  employees,
}: {
  initialRoles: Role[];
  employees: EmployeeRef[];
}) {
  const [roles, setRoles] = useState(initialRoles);
  const [editing, setEditing] = useState<Role | "new" | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const fields: Field[] = [
    { name: "name", label: "Nombre del rol" },
    {
      name: "access_level",
      label: "Nivel de acceso",
      type: "select",
      options: [
        { value: "admin", label: "Administrador (control total de la plataforma)" },
        { value: "gerente", label: "Gerente (gestiona un equipo)" },
        { value: "colaborador", label: "Colaborador (gestiona su propia información)" },
      ],
    },
    { name: "description", label: "Descripción", type: "textarea" },
  ];

  async function handleSave(data: Record<string, string | number>) {
    if (editing === "new") {
      const { data: created, error } = await supabase.from("roles").insert(data).select().single();
      if (!error && created) setRoles([...roles, created as Role]);
    } else if (editing) {
      const { error } = await supabase.from("roles").update(data).eq("id", editing.id);
      if (!error) setRoles(roles.map((r) => (r.id === editing.id ? { ...r, ...data } as Role : r)));
    }
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const count = employees.filter((e) => e.role_id === id).length;
    if (count > 0) {
      alert(`Este rol tiene ${count} usuario(s) asignado(s). Reasígnalos a otro rol antes de eliminarlo.`);
      return;
    }
    if (!confirm("¿Eliminar este rol?")) return;
    const { error } = await supabase.from("roles").delete().eq("id", id);
    if (!error) setRoles(roles.filter((r) => r.id !== id));
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        Catálogo de roles disponibles en la plataforma. El nivel de acceso determina qué pantallas ve
        cada usuario con ese rol.
      </p>
      <div className="mb-3">
        <button
          onClick={() => setEditing("new")}
          className="bg-[#1B3A4B] text-white font-semibold text-sm rounded-md px-3.5 py-2"
        >
          + Nuevo rol
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 border-b-2 border-gray-200">
              <th className="py-1.5 px-2">Rol</th>
              <th className="py-1.5 px-2">Nivel de acceso</th>
              <th className="py-1.5 px-2">Descripción</th>
              <th className="py-1.5 px-2">Usuarios asignados</th>
              <th className="py-1.5 px-2" />
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 last:border-0">
                <td className="py-2 px-2">{r.name}</td>
                <td className="py-2 px-2">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#DDE9F1] text-[#1B3A4B]">
                    {LEVEL_LABEL[r.access_level] ?? r.access_level}
                  </span>
                </td>
                <td className="py-2 px-2">{r.description ?? "—"}</td>
                <td className="py-2 px-2">{employees.filter((e) => e.role_id === r.id).length}</td>
                <td className="py-2 px-2 text-right">
                  <button onClick={() => setEditing(r)} className="text-gray-500 hover:text-[#1B3A4B] mr-2">
                    ✎
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="text-gray-500 hover:text-[#B94A48]">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <FormModal
          title={editing === "new" ? "Nuevo rol" : "Editar rol"}
          fields={fields}
          initial={editing === "new" ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
