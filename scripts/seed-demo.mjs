import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] ??= rest.join("=").trim();
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function orgUnit(name, type, parentId, isRegional = false) {
  const { data, error } = await admin
    .from("org_units")
    .insert({ name, type, parent_id: parentId, is_regional: isRegional })
    .select()
    .single();
  if (error) throw error;
  return data.id;
}

async function createEmployee({ name, pos, email, password, orgUnitId, managerId, roleId }) {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) throw createError;

  const { error: empError } = await admin.from("employees").insert({
    auth_user_id: created.user.id,
    name,
    pos,
    email,
    org_unit_id: orgUnitId,
    manager_id: managerId,
    role_id: roleId,
    hire_date: "2022-01-10",
    status: "active",
  });
  if (empError) throw empError;

  const { data: emp } = await admin.from("employees").select("id").eq("email", email).single();
  return emp.id;
}

const { data: colaboradorRole } = await admin.from("roles").select("id").eq("access_level", "colaborador").single();
const { data: steven } = await admin.from("employees").select("id").eq("email", "sellis@ilpsa.com").single();

const orgRoot = await orgUnit("Gerencia General", "Gerencia General", null, false);
const orgMC = await orgUnit("Mejora Continua", "Departamento", orgRoot, true);
const orgGt = await orgUnit("Guatemala", "País", orgMC, false);
const orgGtMs = await orgUnit("Management Systems", "Área funcional", orgGt, false);
const orgGtCs = await orgUnit("Customer Service", "Área funcional", orgGt, false);
const orgGtSp = await orgUnit("Savings Projects", "Área funcional", orgGt, false);
const orgCr = await orgUnit("Costa Rica", "País", orgMC, false);
const orgCrCoord = await orgUnit("Coordinación Regional", "Coordinación regional", orgCr, false);
const orgPa = await orgUnit("Panamá", "País", orgMC, false);
const orgPaCoord = await orgUnit("Coordinación Regional", "Coordinación regional", orgPa, false);
await orgUnit("El Salvador", "País", orgMC, false);
await orgUnit("Honduras", "País", orgMC, false);
await orgUnit("Nicaragua", "País", orgMC, false);

await admin.from("employees").update({ org_unit_id: orgMC }).eq("id", steven.id);

const luis = await createEmployee({
  name: "Luis Fernández",
  pos: "Analista Sr. Sistemas de Gestión",
  email: "luis.fernandez@ilpsa.com",
  password: "Bienvenido2026!",
  orgUnitId: orgGtMs,
  managerId: steven.id,
  roleId: colaboradorRole.id,
});
const maria = await createEmployee({
  name: "María Torres",
  pos: "Supervisora Servicio al Cliente",
  email: "maria.torres@ilpsa.com",
  password: "Bienvenido2026!",
  orgUnitId: orgGtCs,
  managerId: steven.id,
  roleId: colaboradorRole.id,
});
const carlos = await createEmployee({
  name: "Carlos Pineda",
  pos: "Analista Proyectos de Ahorro",
  email: "carlos.pineda@ilpsa.com",
  password: "Bienvenido2026!",
  orgUnitId: orgGtSp,
  managerId: steven.id,
  roleId: colaboradorRole.id,
});
await createEmployee({
  name: "Ana Ramírez",
  pos: "Coordinadora Regional",
  email: "ana.ramirez@ilpsa.com",
  password: "Bienvenido2026!",
  orgUnitId: orgCrCoord,
  managerId: steven.id,
  roleId: colaboradorRole.id,
});
await createEmployee({
  name: "Sofía Duarte",
  pos: "Coordinadora Regional",
  email: "sofia.duarte@ilpsa.com",
  password: "Bienvenido2026!",
  orgUnitId: orgPaCoord,
  managerId: steven.id,
  roleId: colaboradorRole.id,
});

const { data: mciCorp } = await admin
  .from("mcis")
  .insert({
    title: "Elevar cumplimiento de auditorías de sistemas de gestión",
    statement: "De 82% a 95% de cumplimiento de auditorías SMETA para el cierre de Q4",
    level: "corporate",
    owner_id: steven.id,
    org_unit_id: orgMC,
    baseline: 82,
    target: 95,
    current_value: 72,
    uom: "%",
    start_date: "2026-01-01",
    target_date: "2026-12-31",
    status: "at_risk",
  })
  .select()
  .single();

const { data: mciDept } = await admin
  .from("mcis")
  .insert({
    parent_mci_id: mciCorp.id,
    title: "Cerrar hallazgos de auditoría a tiempo",
    statement: "De 60% a 95% de hallazgos cerrados en menos de 7 días",
    level: "department",
    owner_id: luis,
    org_unit_id: orgGtMs,
    baseline: 60,
    target: 95,
    current_value: 68,
    uom: "%",
    start_date: "2026-01-01",
    target_date: "2026-12-31",
    status: "at_risk",
  })
  .select()
  .single();

await admin.from("mcis").insert({
  parent_mci_id: mciDept.id,
  title: "Completar auditorías internas asignadas",
  statement: "De 3 a 5 auditorías internas completadas por mes",
  level: "individual",
  owner_id: luis,
  org_unit_id: orgGtMs,
  baseline: 3,
  target: 5,
  current_value: 3,
  uom: "auditorías",
  start_date: "2026-01-01",
  target_date: "2026-12-31",
  status: "off_track",
});

const { data: lm1 } = await admin
  .from("lead_measures")
  .insert({ mci_id: mciDept.id, title: "Auditorías internas completadas", measure_type: "lead", target: 5, cadence: "weekly", responsible_id: luis })
  .select()
  .single();
const { data: lm2 } = await admin
  .from("lead_measures")
  .insert({ mci_id: mciDept.id, title: "Hallazgos cerrados <7 días", measure_type: "lag", target: 95, cadence: "weekly", responsible_id: luis })
  .select()
  .single();

await admin.from("measure_entries").insert([
  { lead_measure_id: lm1.id, week: "2026-W28", value: 3, reported_by: luis },
  { lead_measure_id: lm2.id, week: "2026-W28", value: 80, reported_by: luis },
]);

await admin.from("commitments").insert([
  { week: "2026-W29", employee_id: luis, description: "Cerrar 2 hallazgos abiertos de la auditoría de junio", due_date: "2026-07-24", status: "open" },
  { week: "2026-W29", employee_id: maria, description: "Completar encuesta de satisfacción a 20 clientes", due_date: "2026-07-25", status: "open" },
  { week: "2026-W28", employee_id: luis, description: "Programar auditoría interna de julio", due_date: "2026-07-18", status: "done" },
  { week: "2026-W28", employee_id: carlos, description: "Enviar reporte de ahorro mensual", due_date: "2026-07-17", status: "missed" },
]);

await admin.from("tasks").insert([
  { employee_id: luis, title: "Cerrar hallazgo crítico de auditoría", quadrant: 1, due_date: "2026-07-23", status: "pending", week: "2026-W30" },
  { employee_id: luis, title: "Revisar PID del equipo", quadrant: 2, due_date: "2026-07-25", status: "pending", week: "2026-W30" },
  { employee_id: maria, title: "Responder correos de proveedores", quadrant: 3, due_date: "2026-07-22", status: "pending", week: "2026-W30" },
  { employee_id: steven.id, title: "Preparar reunión de rendición de cuentas regional", quadrant: 2, due_date: "2026-07-24", status: "pending", week: "2026-W30" },
]);

await admin.from("evaluations").insert({
  employee_id: luis,
  evaluator: "Steven Ellis",
  type: "180",
  cycle: "2026-S1",
  scores: [
    { name: "Orientación a resultados", score: 4.2 },
    { name: "Trabajo en equipo", score: 4.5 },
  ],
  comment: "Buen desempeño técnico, fortalecer seguimiento a compromisos.",
  status: "completed",
});

await admin.from("one_on_ones").insert({
  leader_id: steven.id,
  collaborator_id: luis,
  date: "2026-07-15",
  notes: "Revisamos avance de auditorías y prioridades de la semana.",
  agreements: [{ description: "Enviar plan de cierre de hallazgos", dueDate: "2026-07-22", status: "open" }],
});

await admin.from("development_plans").insert({
  employee_id: luis,
  year: 2026,
  focus_area: "Auditoría interna avanzada",
  courses: [{ title: "ISO 19011 Lead Auditor", status: "in_progress" }],
});

await admin.from("recognitions").insert([
  { from_id: steven.id, to_id: maria, badge: "Enfoque en el cliente", message: "Excelente manejo de un caso complejo esta semana.", points: 50, date: "2026-07-20" },
  { from_id: luis, to_id: carlos, badge: "Trabajo en equipo", message: "Gracias por el apoyo en el cierre de mes.", points: 30, date: "2026-07-18" },
]);

console.log("Datos de demostración creados.");
console.log("Colaboradores de prueba (contraseña: Bienvenido2026!):");
console.log("  luis.fernandez@ilpsa.com, maria.torres@ilpsa.com, carlos.pineda@ilpsa.com, ana.ramirez@ilpsa.com, sofia.duarte@ilpsa.com");
