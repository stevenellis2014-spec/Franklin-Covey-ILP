import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] ??= rest.join("=").trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_EMAIL = "sellis@ilpsa.com";
const ADMIN_PASSWORD = process.argv[2];
const ADMIN_ROLE_ID = "00000000-0000-0000-0000-000000000001";

if (!ADMIN_PASSWORD) {
  console.error("Uso: node scripts/seed-admin.mjs <contraseña-temporal>");
  process.exit(1);
}

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
  email_confirm: true,
});

if (createError) {
  console.error("Error creando usuario de auth:", createError.message);
  process.exit(1);
}

const { error: empError } = await supabase.from("employees").upsert(
  {
    auth_user_id: created.user.id,
    name: "Steven Ellis",
    pos: "Gerente Regional de Mejora Continua",
    email: ADMIN_EMAIL,
    role_id: ADMIN_ROLE_ID,
    hire_date: "2022-01-10",
    status: "active",
  },
  { onConflict: "email" }
);

if (empError) {
  console.error("Error creando el expediente de empleado:", empError.message);
  process.exit(1);
}

console.log(`Cuenta de administrador creada: ${ADMIN_EMAIL}`);
