"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createDirectReport(input: {
  name: string;
  email: string;
  pos: string;
  org_unit_id: string | null;
  hire_date: string;
  status: string;
  initialPassword: string;
}) {
  const { employee, role } = await getSessionContext();
  if (role !== "gerente") return { error: "No autorizado" };

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
  const { data: colaboradorRole } = await supabase
    .from("roles")
    .select("id")
    .eq("access_level", "colaborador")
    .limit(1)
    .single();

  const { error: empError } = await supabase.from("employees").insert({
    auth_user_id: created.user.id,
    name: input.name,
    email: input.email,
    pos: input.pos,
    org_unit_id: input.org_unit_id || null,
    manager_id: employee.id,
    role_id: colaboradorRole?.id,
    status: input.status,
    hire_date: input.hire_date,
  });

  if (empError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: empError.message };
  }

  revalidatePath("/personal");
  return { ok: true };
}
