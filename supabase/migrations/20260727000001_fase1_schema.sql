-- Fase 1: esquema base validado en el prototipo (ver claude-code-kickoff-brief.md, sección 5)
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

-- Roles base (catálogo fijo, coincide con el prototipo)
insert into roles (id, name, access_level, description) values
  ('00000000-0000-0000-0000-000000000001', 'Administrador', 'admin', 'Control total: usuarios, roles y organigrama de la plataforma.'),
  ('00000000-0000-0000-0000-000000000002', 'Gerente', 'gerente', 'Gestiona a su equipo: MCIs, rendición de cuentas, desempeño y desarrollo.'),
  ('00000000-0000-0000-0000-000000000003', 'Colaborador', 'colaborador', 'Reporta su propia rendición de cuentas semanal y gestiona sus MCIs individuales.');
