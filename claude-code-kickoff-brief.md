# Guía de Implementación — Franklin Covey ILP con Claude Code

Este documento es el punto de partida que le vas a dar a Claude Code. Junto con `people-excellence-platform-spec.md` (la especificación completa) y `franklin-covey-ilp-app.html` (el prototipo ya validado contigo), le da a Claude Code todo lo que necesita para empezar a codificar sin tener que adivinar decisiones que tú ya tomaste.

**Cómo usar este documento:** cada sección es un insumo directo para una fase de construcción. No es lectura de una sola vez — vas a volver a él en cada sesión con Claude Code.

---

## 0. Glosario — para que cualquier desarrollador entienda el dominio sin preguntarte

| Término | Significado |
|---|---|
| **MCI** | Meta Crucialmente Importante (equivalente al "WIG" de FranklinCovey). Puede ser corporativa, departamental o individual, y las individuales cuelgan de las departamentales, que cuelgan de las corporativas. |
| **Lead / Lag measure** | Indicador predictivo (lead) o de resultado (lag) que alimenta una MCI. |
| **Rendición de Cuentas Semanal** | El ciclo semanal donde cada colaborador reporta sus actividades, propone compromisos para la próxima semana, y opcionalmente registra despejes de camino. |
| **Despeje de camino** | Un obstáculo que el colaborador no puede resolver solo y necesita que su líder le ayude a despejar. |
| **Puesto Regional** | Un nodo del organigrama que, en vez de tener sub-unidades funcionales normales, tiene su propia estructura de países por debajo (ej. un Gerente Regional que coordina varios países). |
| **Gerente** (nivel de acceso) | Ve y administra solo a su equipo (él mismo + todos los que le reportan, directa o indirectamente). |
| **Colaborador** (nivel de acceso) | Ve y administra solo su propia información. |
| **Administrador** (nivel de acceso) | Ve y administra toda la plataforma: usuarios, roles, organigrama institucional. |

---

## 1. Stack recomendado (para un desarrollador trabajando solo)

| Capa | Recomendación | Por qué |
|---|---|---|
| Frontend | Next.js (App Router) + Tailwind CSS | Ecosistema por defecto de Claude Code; despliegue directo a Vercel |
| Base de datos + Auth | Supabase (Postgres administrado) | Postgres real, autenticación por correo/contraseña, y permisos por fila (RLS) sin construirlos desde cero |
| Hosting | Vercel (frontend) + Supabase (datos) | Capa gratuita suficiente para un piloto interno; Postgres estándar, migrar a Azure después es cambio de conexión, no de arquitectura |
| Envío de correo | Resend o SendGrid | Reemplaza los enlaces `mailto:` del prototipo por correos enviados de verdad |
| Control de versiones | Git + GitHub (repositorio privado) | Para poder revisar cada fase como un commit o PR separado |

Si tu empresa exige Azure desde el día uno, el mismo plan funciona reemplazando Supabase por Azure Database for PostgreSQL + Azure AD B2C — el orden de construcción no cambia, solo el proveedor de infraestructura.

---

## 2. Prerrequisitos — cuentas y accesos que necesitas crear antes de empezar

- [ ] Cuenta de [Supabase](https://supabase.com) (gratuita para empezar) + un proyecto nuevo creado
- [ ] Cuenta de [Vercel](https://vercel.com), conectada a tu cuenta de GitHub
- [ ] Un repositorio en GitHub (privado) para el proyecto
- [ ] Cuenta de [Resend](https://resend.com) o SendGrid para envío de correo (fase 5, no urgente al inicio)
- [ ] Node.js 20+ instalado si vas a correr Claude Code en terminal/VS Code en tu propia máquina
- [ ] Decidir el dominio o subdominio donde vivirá la plataforma (ej. `ilp.industrialapopular.com`) — no es necesario tenerlo desde el día uno, pero es bueno saberlo para la configuración de Vercel más adelante

---

## 3. Variables de entorno

Crea un archivo `.env.local` (nunca lo subas a git — agrégalo a `.gitignore`) con:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # solo se usa en el servidor, nunca en el navegador
RESEND_API_KEY=                  # fase 5
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Pídele a Claude Code que genere también un `.env.example` con las mismas claves sin valores, para que el repositorio documente qué variables se necesitan sin exponer secretos.

---

## 4. Estructura de carpetas sugerida

```
/app
  /(auth)/login
  /(app)/dashboard
  /(app)/mcis
  /(app)/rendicion-de-cuentas
  /(app)/personal
  /(app)/mi-departamento
  /(app)/desempeno
  /(app)/uno-a-uno
  /(app)/tiempo
  /(app)/desarrollo
  /(app)/reconocimiento
  /(app)/admin/usuarios
  /(app)/admin/roles
  /(app)/admin/organigrama
  /api/...                       # rutas de API si no usas Server Actions
/lib
  /supabase                      # cliente de Supabase (browser + server)
  /auth.ts                       # helpers de sesión y rol actual
/components
/types                           # tipos TypeScript generados desde el esquema de Supabase
```

---

## 5. Esquema de base de datos (SQL listo para Supabase)

Este esquema ya está validado en el prototipo — dáselo a Claude Code tal cual, no hay que rediseñarlo.

```sql
create extension if not exists "uuid-ossp";

create table roles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  access_level text not null check (access_level in ('admin','gerente','colaborador')),
  description text
);

create table org_units (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid references org_units(id) on delete restrict,
  name text not null,
  type text not null,
  is_regional boolean not null default false
);

create table employees (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  pos text,
  org_unit_id uuid references org_units(id),
  manager_id uuid references employees(id),
  email text unique not null,
  role_id uuid references roles(id) not null,
  hire_date date,
  status text not null default 'active' check (status in ('active','on_leave','suspended','terminated'))
);

create table mcis (
  id uuid primary key default uuid_generate_v4(),
  parent_mci_id uuid references mcis(id),
  title text not null,
  statement text,
  level text not null check (level in ('corporate','department','individual')),
  owner_id uuid references employees(id),
  org_unit_id uuid references org_units(id),
  baseline numeric, target numeric, current_value numeric,
  uom text,
  start_date date, target_date date,
  status text not null default 'on_track' check (status in ('on_track','at_risk','off_track','achieved'))
);

create table lead_measures (
  id uuid primary key default uuid_generate_v4(),
  mci_id uuid references mcis(id) on delete cascade,
  title text not null,
  measure_type text check (measure_type in ('lead','lag')),
  target numeric,
  cadence text check (cadence in ('weekly','biweekly','monthly')),
  responsible_id uuid references employees(id)
);

create table measure_entries (
  id uuid primary key default uuid_generate_v4(),
  lead_measure_id uuid references lead_measures(id) on delete cascade,
  week text not null,
  value numeric,
  reported_by uuid references employees(id)
);

create table commitments (
  id uuid primary key default uuid_generate_v4(),
  week text not null,
  employee_id uuid references employees(id) on delete cascade,
  description text not null,
  due_date date,
  status text not null default 'open' check (status in ('open','done','missed'))
);

create table tasks (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade,
  title text not null,
  quadrant smallint not null check (quadrant between 1 and 4),
  due_date date,
  status text not null default 'pending' check (status in ('pending','done')),
  week text
);

create table evaluations (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade,
  evaluator text,
  type text check (type in ('90','180','360')),
  cycle text,
  scores jsonb not null default '[]',
  comment text,
  status text not null default 'pending' check (status in ('pending','completed'))
);

create table one_on_ones (
  id uuid primary key default uuid_generate_v4(),
  leader_id uuid references employees(id),
  collaborator_id uuid references employees(id),
  date date,
  notes text,
  agreements jsonb not null default '[]'
);

create table development_plans (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade,
  year int,
  focus_area text,
  courses jsonb not null default '[]'
);

create table recognitions (
  id uuid primary key default uuid_generate_v4(),
  from_id uuid references employees(id),
  to_id uuid references employees(id),
  badge text,
  message text,
  points int default 0,
  date date default now()
);

create table weekly_reports (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade,
  week text not null,
  activities jsonb not null default '[]',
  next_commitments jsonb not null default '[]',
  roadblocks jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft','submitted')),
  submitted_at timestamptz,
  unique(employee_id, week)
);
```

Nota sobre `auth_user_id`: Supabase Auth maneja el login (correo/contraseña) por separado en su propia tabla `auth.users`; `employees` guarda los datos de negocio y se enlaza a esa cuenta de autenticación por `auth_user_id`. Esto reemplaza el `password_hash` manual del prototipo — Supabase ya hace el hashing correctamente.

---

## 6. Políticas de seguridad por fila (RLS) — quién puede ver/editar qué

Esto es lo que en el prototipo solo se simulaba escondiendo botones. En producción tiene que aplicarse en la base de datos, no solo en el frontend.

| Tabla | Colaborador | Gerente | Administrador |
|---|---|---|---|
| `employees` | Lee y edita solo su propia fila | Lee/edita su fila y las de todo su equipo (recursivo por `manager_id`) | Lee y edita todas |
| `mcis`, `lead_measures`, `measure_entries` | Lee/edita solo donde `owner_id` = su propio id | Lee/edita las de su equipo | Todas |
| `commitments`, `tasks`, `weekly_reports` | Lee/edita solo las suyas (`employee_id` = su id) | Lee las de su equipo; edita solo las suyas | Todas |
| `evaluations`, `one_on_ones`, `development_plans` | Lee las que le pertenecen | Lee/edita las de su equipo | Todas |
| `recognitions` | Lee todas (muro público); crea las suyas | Igual que colaborador | Todas |
| `roles`, `org_units` | Solo lectura | Solo lectura (excepto su propia rama de organigrama — ver nota abajo) | Lectura y escritura total |

**Nota sobre "Mi Departamento":** el Gerente puede escribir en `org_units` únicamente para nodos que sean descendientes de su propio `org_unit_id`. Esto requiere una política RLS con una función recursiva (`is_descendant_of`), no solo una comparación simple — pídele a Claude Code que la escriba como función de Postgres reutilizable.

Pídele a Claude Code que traduzca esta tabla a políticas `create policy ...` de Supabase, una por tabla y operación (select/insert/update/delete).

---

## 7. Rutas / endpoints necesarios (resumen — el detalle completo está en la especificación, sección 4)

- `POST /auth/login`, `POST /auth/logout`
- `GET/POST/PATCH/DELETE /api/employees`
- `GET/POST/PATCH/DELETE /api/roles`
- `GET/POST/PATCH/DELETE /api/org-units`
- `GET/POST/PATCH/DELETE /api/mcis`, `/api/lead-measures`, `/api/measure-entries`
- `GET/POST/PATCH /api/commitments`
- `GET/POST /api/weekly-reports`, `PATCH /api/weekly-reports/:id/submit`
- `GET/POST/PATCH/DELETE /api/tasks`
- `GET/POST/DELETE /api/evaluations`, `/api/one-on-ones`, `/api/development-plans`, `/api/recognitions`

Si usas Server Actions de Next.js en vez de rutas de API, dile a Claude Code que las organice por módulo (`/lib/actions/mcis.ts`, etc.) siguiendo la misma división.

---

## 8. Orden de construcción y criterios de aceptación por fase

Dale estas fases a Claude Code **una por una**. Al final de cada una, verifica los criterios antes de avanzar.

### Fase 1 — Cimentación
**Hacer:** proyecto Next.js, conexión a Supabase, tablas del esquema (sección 5), login real con correo/contraseña, sembrar la cuenta `sellis@ilpsa.com` con rol Administrador.
**Criterio de aceptación:** puedes entrar con esa cuenta y ver una pantalla vacía de "Dashboard" — sin errores en consola, sesión persiste al recargar la página.

### Fase 2 — Roles y Organigrama
**Hacer:** pantallas de Gestión de Usuarios, Roles y Permisos, Organigrama (con el check "Regional" y el drill-down), políticas RLS de la sección 6 aplicadas.
**Criterio de aceptación:** creas un usuario nuevo desde la pantalla de Administrador, ese usuario puede iniciar sesión con las credenciales que le diste, y ve solo lo que su rol permite.

### Fase 3 — Núcleo 4DX
**Hacer:** MCIs con indicadores lead/lag, el asistente de Rendición de Cuentas Semanal completo (4 pasos).
**Criterio de aceptación:** un Colaborador de prueba completa el asistente de principio a fin y su Gerente lo ve reflejado en su tablero de equipo.

### Fase 4 — Resto de módulos
**Hacer:** Desempeño, Reuniones Individuales, Gestión del Tiempo, Desarrollo de Talento, Reconocimiento.
**Criterio de aceptación:** cada módulo tiene su CRUD funcionando y respeta el alcance por rol de la sección 6.

### Fase 5 — Pulido y piloto
**Hacer:** correos reales de recordatorio (Resend/SendGrid), desplegar a un dominio de prueba, revisar responsividad básica en móvil.
**Criterio de aceptación:** recibes en tu correo real un recordatorio de prueba, y la plataforma es usable desde un teléfono para la Rendición de Cuentas Semanal.

---

## 9. Plan de pruebas manual (smoke test) para cada fase

Antes de decir "esta fase está lista", prueba con al menos dos usuarios distintos (un Gerente y un Colaborador de prueba) y verifica:
1. Cada uno ve solo lo que le corresponde (no puede ver datos de otro equipo).
2. Cerrar sesión y volver a entrar no pierde datos.
3. Recargar la página a mitad de un formulario no corrompe lo ya guardado.
4. Las acciones de eliminar piden confirmación y no dejan referencias huérfanas (ej. borrar una unidad de organigrama con gente asignada).

---

## 10. Checklist de despliegue

- [ ] Repositorio conectado a Vercel, variables de entorno configuradas ahí (no solo en local)
- [ ] Dominio o subdominio apuntando al proyecto de Vercel
- [ ] Backups automáticos activados en Supabase (están activados por defecto en proyectos pagos; verificar en el plan gratuito)
- [ ] Confirmar con IT si el dominio/subdominio necesita pasar por su DNS

---

## 11. Decisiones pendientes — cosas que tú tienes que definir, no Claude Code

- **Departamentos reales de Industria La Popular más allá de Mejora Continua.** El organigrama sembrado solo tiene tu departamento como ejemplo — el resto de la empresa hay que agregarlo.
- **Política de contraseñas** (longitud mínima, si expiran, si se exige cambio en el primer ingreso).
- **Qué pasa con empleados que ya no están activos** — ¿se eliminan o se archivan? (el esquema ya soporta `status: terminated`, pero la política de retención de datos es una decisión de RRHH, no técnica).
- **Quién más, además de ti, necesita el rol Administrador** — hoy solo existe una cuenta con ese nivel de acceso garantizado.
- **Contenido real de los correos de recordatorio** (tono, firma, si debe ir en nombre de RRHH o del Gerente directo).

---

## 12. Sobre el prototipo HTML

El HTML del prototipo no es código desechable — la lógica de cada pantalla (cómo se calcula el avance de una MCI, cómo se genera el reporte semanal, cómo se filtra por equipo según el rol) ya está resuelta ahí. Pídele a Claude Code que la lea como referencia de comportamiento, no que la reescriba desde cero.

---

## 13. Primer prompt para Claude Code

> Voy a construir la versión real de una plataforma llamada Franklin Covey ILP. Te adjunto la especificación funcional completa (`people-excellence-platform-spec.md`), un prototipo funcional en HTML con toda la lógica de negocio ya validada (`franklin-covey-ilp-app.html`), y esta guía de implementación (`claude-code-kickoff-brief.md`), que ya incluye el esquema SQL, las políticas de seguridad por rol, y los criterios de aceptación por fase. Quiero empezar solo por la Fase 1 de la sección 8: crear el proyecto Next.js, conectarlo a Supabase, y crear las tablas de la sección 5. No avances a fases posteriores todavía.

Súbele los tres archivos junto con ese mensaje.
