"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const { role } = await getSessionContext();
  if (role !== "admin") throw new Error("No autorizado");
}

export async function createUser(input: {
  name: string;
  email: string;
  pos: string;
  role_id: string;
  org_unit_id: string | null;
  manager_id: string | null;
  status: string;
  initialPassword: string;
}) {
  await requireAdmin();

  if (!input.initialPassword || input.initialPassword.length < 8) {
    return { error: "La contraseña inicial debe tener al menos 8 caracteres." };
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.initialPassword,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "No se pudo crear el usuario." };
  }

  const supabase = await createClient();
  const { error: empError } = await supabase.from("employees").insert({
    auth_user_id: created.user.id,
    name: input.name,
    email: input.email,
    pos: input.pos,
    role_id: input.role_id,
    org_unit_id: input.org_unit_id || null,
    manager_id: input.manager_id || null,
    status: input.status,
    hire_date: new Date().toISOString().slice(0, 10),
  });

  if (empError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: empError.message };
  }

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function resetPassword(employeeId: string, newPassword: string) {
  await requireAdmin();

  if (!newPassword || newPassword.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("auth_user_id")
    .eq("id", employeeId)
    .single();

  if (!employee) return { error: "Usuario no encontrado." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(employee.auth_user_id, {
    password: newPassword,
  });

  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteEmployee(employeeId: string) {
  await requireAdmin();

  const supabase = await createClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("auth_user_id")
    .eq("id", employeeId)
    .single();

  await supabase.from("employees").update({ manager_id: null }).eq("manager_id", employeeId);
  const { error } = await supabase.from("employees").delete().eq("id", employeeId);
  if (error) return { error: error.message };

  if (employee?.auth_user_id) {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(employee.auth_user_id);
  }

  revalidatePath("/admin/usuarios");
  return { ok: true };
}
