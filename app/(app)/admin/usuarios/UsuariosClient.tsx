"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormModal, type Field } from "@/components/FormModal";
import { Pill } from "@/components/Pill";
import { createUser, resetPassword, deleteEmployee } from "./actions";

type Role = { id: string; name: string; access_level: string };
type OrgUnit = { id: string; name: string; parent_id: string | null };
type Employee = {
  id: string;
  name: string;
  email: string;
  pos: string | null;
  role_id: string;
  org_unit_id: string | null;
  manager_id: string | null;
  status: string;
  roles: { name: string; access_level: string } | null;
};

function orgUnitOptions(orgUnits: OrgUnit[]) {
  const result = [{ value: "", label: "— Sin asignar —" }];
  function walk(parentId: string | null, depth: number) {
    orgUnits
      .filter((u) => u.parent_id === parentId)
      .forEach((u) => {
        result.push({ value: u.id, label: " ".repeat(depth) + u.name });
        walk(u.id, depth + 1);
      });
  }
  walk(null, 0);
  return result;
}

export function UsuariosClient({
  initialEmployees,
  roles,
  orgUnits,
  adminEmail,
}: {
  initialEmployees: Employee[];
  roles: Role[];
  orgUnits: OrgUnit[];
  adminEmail: string;
}) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState<Employee | "new" | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const orgOptions = useMemo(() => orgUnitOptions(orgUnits), [orgUnits]);
  const orgName = (id: string | null) => orgUnits.find((u) => u.id === id)?.name ?? "Sin asignar";
  const empName = (id: string | null) => employees.find((e) => e.id === id)?.name ?? "—";

  const filtered = employees.filter((e) => {
    if (search && !(e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase())))
      return false;
    if (roleFilter && e.role_id !== roleFilter) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    return true;
  });

  const fields: Field[] = [
    { name: "name", label: "Nombre completo" },
    { name: "email", label: "Correo electrónico", type: "email" },
    { name: "pos", label: "Puesto" },
    { name: "role_id", label: "Rol", type: "select", options: roles.map((r) => ({ value: r.id, label: r.name })) },
    { name: "org_unit_id", label: "Unidad organizacional", type: "select", options: orgOptions },
    {
      name: "manager_id",
      label: "Jefe directo",
      type: "select",
      options: [{ value: "", label: "— Ninguno —" }, ...employees.map((e) => ({ value: e.id, label: e.name }))],
    },
    {
      name: "status",
      label: "Estado",
      type: "select",
      options: [
        { value: "active", label: "Activo" },
        { value: "on_leave", label: "De permiso" },
        { value: "suspended", label: "Suspendido" },
        { value: "terminated", label: "Inactivo" },
      ],
    },
  ];

  async function handleSave(data: Record<string, string | number>) {
    if (editing === "new") {
      const pw = prompt("Contraseña inicial para este usuario (mínimo 8 caracteres):") ?? "";
      const result = await createUser({
        name: String(data.name),
        email: String(data.email),
        pos: String(data.pos),
        role_id: String(data.role_id),
        org_unit_id: data.org_unit_id ? String(data.org_unit_id) : null,
        manager_id: data.manager_id ? String(data.manager_id) : null,
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
          role_id: data.role_id,
          org_unit_id: data.org_unit_id || null,
          manager_id: data.manager_id || null,
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

  async function handleToggleStatus(emp: Employee) {
    const next = emp.status === "active" ? "suspended" : "active";
    const { error } = await supabase.from("employees").update({ status: next }).eq("id", emp.id);
    if (!error) setEmployees(employees.map((e) => (e.id === emp.id ? { ...e, status: next } : e)));
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este usuario de la plataforma? Esta acción no se puede deshacer.")) return;
    const result = await deleteEmployee(id);
    if (result.error) {
      alert(result.error);
      return;
    }
    setEmployees(employees.filter((e) => e.id !== id));
  }

  async function handleResetPassword() {
    const pw = prompt("Nueva contraseña (mínimo 8 caracteres):");
    if (!pw || !resettingId) return;
    const result = await resetPassword(resettingId, pw);
    if (result.error) alert(result.error);
    else alert("Contraseña actualizada.");
    setResettingId(null);
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        Esta pantalla solo es visible para la cuenta de administración. Aquí puedes ver y administrar a
        todos los usuarios de la plataforma, incluyendo su rol.
      </p>
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <input
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-200 rounded-md text-[12.5px]"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-200 rounded-md text-[12.5px]"
        >
          <option value="">Todos los roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-200 rounded-md text-[12.5px]"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="on_leave">De permiso</option>
          <option value="suspended">Suspendido</option>
          <option value="terminated">Inactivo</option>
        </select>
        <button
          onClick={() => setEditing("new")}
          className="bg-[#1B3A4B] text-white font-semibold text-sm rounded-md px-3.5 py-2 ml-auto"
        >
          + Nuevo usuario
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 border-b-2 border-gray-200">
              <th className="py-1.5 px-2">Nombre</th>
              <th className="py-1.5 px-2">Correo</th>
              <th className="py-1.5 px-2">Rol</th>
              <th className="py-1.5 px-2">Unidad organizacional</th>
              <th className="py-1.5 px-2">Jefe</th>
              <th className="py-1.5 px-2">Estado</th>
              <th className="py-1.5 px-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((e) => {
                const isProtected = e.email.toLowerCase() === adminEmail.toLowerCase();
                return (
                  <tr key={e.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 px-2">{e.name}</td>
                    <td className="py-2 px-2">{e.email}</td>
                    <td className="py-2 px-2">{e.roles?.name ?? "—"}</td>
                    <td className="py-2 px-2">{orgName(e.org_unit_id)}</td>
                    <td className="py-2 px-2">{empName(e.manager_id)}</td>
                    <td className="py-2 px-2">
                      <Pill status={e.status} />
                    </td>
                    <td className="py-2 px-2 text-right whitespace-nowrap">
                      <button onClick={() => setEditing(e)} title="Editar" className="text-gray-500 hover:text-[#1B3A4B] mr-2">
                        ✎
                      </button>
                      <button
                        onClick={() => setResettingId(e.id)}
                        title="Restablecer contraseña"
                        className="text-gray-500 hover:text-[#1B3A4B] mr-2"
                      >
                        🔑
                      </button>
                      {!isProtected && (
                        <>
                          <button
                            onClick={() => handleToggleStatus(e)}
                            title={e.status === "active" ? "Suspender" : "Activar"}
                            className="text-gray-500 hover:text-[#1B3A4B] mr-2"
                          >
                            {e.status === "active" ? "⏸" : "▶"}
                          </button>
                          <button onClick={() => handleDelete(e.id)} title="Eliminar" className="text-gray-500 hover:text-[#B94A48]">
                            ✕
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-4 text-center text-gray-400 italic">
                  No se encontraron usuarios con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <FormModal
          title={editing === "new" ? "Nuevo usuario" : "Editar usuario"}
          fields={fields}
          initial={editing === "new" ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          extra={
            editing === "new" ? (
              <div className="text-xs text-gray-500 mb-3">
                Al guardar te pedirá la contraseña inicial para este usuario.
              </div>
            ) : (
              <div className="text-xs text-gray-500 mb-3">
                Para cambiar la contraseña usa el botón 🔑 &quot;Restablecer contraseña&quot; en la tabla.
              </div>
            )
          }
        />
      )}

      {resettingId && (
        <div
          className="fixed inset-0 bg-[#1B3A4B]/35 flex items-center justify-center z-50 px-4"
          onClick={(e) => e.target === e.currentTarget && setResettingId(null)}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-[380px]">
            <h3 className="font-semibold text-base mb-4">Restablecer contraseña</h3>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setResettingId(null)}
                className="border border-gray-200 rounded-md px-3.5 py-2 text-[13px] font-semibold text-[#1B3A4B]"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                className="bg-[#1B3A4B] text-white rounded-md px-3.5 py-2 text-[13px] font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
