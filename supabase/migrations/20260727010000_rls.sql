-- Fase 2: Row Level Security — ver claude-code-kickoff-brief.md sección 6

-- ============ Funciones auxiliares ============
create or replace function current_employee_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from employees where auth_user_id = auth.uid()
$$;

create or replace function current_access_level() returns text
language sql stable security definer set search_path = public as $$
  select r.access_level from employees e join roles r on r.id = e.role_id where e.auth_user_id = auth.uid()
$$;

create or replace function is_in_my_team(target_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  with recursive team as (
    select id from employees where id = current_employee_id()
    union all
    select e.id from employees e join team t on e.manager_id = t.id
  )
  select exists(select 1 from team where id = target_id)
$$;

create or replace function is_descendant_org_unit(target_id uuid, root_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  with recursive branch as (
    select id from org_units where id = root_id
    union all
    select u.id from org_units u join branch b on u.parent_id = b.id
  )
  select target_id is not null and exists(select 1 from branch where id = target_id)
$$;

create or replace function is_in_my_org_branch(target_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_descendant_org_unit(target_id, (select org_unit_id from employees where id = current_employee_id()))
$$;

-- ============ Enable RLS ============
alter table roles enable row level security;
alter table org_units enable row level security;
alter table employees enable row level security;
alter table mcis enable row level security;
alter table lead_measures enable row level security;
alter table measure_entries enable row level security;
alter table commitments enable row level security;
alter table tasks enable row level security;
alter table evaluations enable row level security;
alter table one_on_ones enable row level security;
alter table development_plans enable row level security;
alter table recognitions enable row level security;
alter table weekly_reports enable row level security;

-- ============ roles ============
create policy "roles_select_all" on roles for select using (auth.uid() is not null);
create policy "roles_write_admin" on roles for all
  using (current_access_level() = 'admin') with check (current_access_level() = 'admin');

-- ============ org_units ============
create policy "org_units_select_all" on org_units for select using (auth.uid() is not null);
create policy "org_units_write_admin" on org_units for all
  using (current_access_level() = 'admin') with check (current_access_level() = 'admin');
create policy "org_units_write_gerente_branch" on org_units for all
  using (current_access_level() = 'gerente' and is_in_my_org_branch(id))
  with check (current_access_level() = 'gerente' and is_in_my_org_branch(parent_id));

-- ============ employees ============
create policy "employees_select_scope" on employees for select using (
  current_access_level() = 'admin'
  or id = current_employee_id()
  or is_in_my_team(id)
);
create policy "employees_insert_scope" on employees for insert with check (
  current_access_level() = 'admin'
  or (current_access_level() = 'gerente' and manager_id = current_employee_id())
);
create policy "employees_update_scope" on employees for update using (
  current_access_level() = 'admin'
  or id = current_employee_id()
  or (current_access_level() = 'gerente' and is_in_my_team(id))
);
create policy "employees_delete_scope" on employees for delete using (
  current_access_level() = 'admin'
  or (current_access_level() = 'gerente' and is_in_my_team(id) and id <> current_employee_id())
);

-- ============ mcis ============
create policy "mcis_select_scope" on mcis for select using (
  current_access_level() = 'admin' or is_in_my_team(owner_id)
);
create policy "mcis_write_scope" on mcis for all using (
  current_access_level() = 'admin' or is_in_my_team(owner_id)
) with check (
  current_access_level() = 'admin' or is_in_my_team(owner_id)
);

-- ============ lead_measures ============
create policy "lead_measures_select_scope" on lead_measures for select using (
  current_access_level() = 'admin'
  or exists (select 1 from mcis w where w.id = mci_id and is_in_my_team(w.owner_id))
);
create policy "lead_measures_write_scope" on lead_measures for all using (
  current_access_level() = 'admin'
  or exists (select 1 from mcis w where w.id = mci_id and is_in_my_team(w.owner_id))
) with check (
  current_access_level() = 'admin'
  or exists (select 1 from mcis w where w.id = mci_id and is_in_my_team(w.owner_id))
);

-- ============ measure_entries ============
create policy "measure_entries_select_scope" on measure_entries for select using (
  current_access_level() = 'admin'
  or exists (
    select 1 from lead_measures lm join mcis w on w.id = lm.mci_id
    where lm.id = lead_measure_id and is_in_my_team(w.owner_id)
  )
);
create policy "measure_entries_write_scope" on measure_entries for all using (
  current_access_level() = 'admin'
  or exists (
    select 1 from lead_measures lm join mcis w on w.id = lm.mci_id
    where lm.id = lead_measure_id and is_in_my_team(w.owner_id)
  )
) with check (
  current_access_level() = 'admin'
  or exists (
    select 1 from lead_measures lm join mcis w on w.id = lm.mci_id
    where lm.id = lead_measure_id and is_in_my_team(w.owner_id)
  )
);

-- ============ commitments ============
create policy "commitments_select_scope" on commitments for select using (
  current_access_level() = 'admin' or is_in_my_team(employee_id)
);
create policy "commitments_write_own_or_admin" on commitments for all using (
  current_access_level() = 'admin' or employee_id = current_employee_id()
) with check (
  current_access_level() = 'admin' or employee_id = current_employee_id()
);

-- ============ tasks ============
create policy "tasks_select_scope" on tasks for select using (
  current_access_level() = 'admin' or is_in_my_team(employee_id)
);
create policy "tasks_write_own_or_admin" on tasks for all using (
  current_access_level() = 'admin' or employee_id = current_employee_id()
) with check (
  current_access_level() = 'admin' or employee_id = current_employee_id()
);

-- ============ weekly_reports ============
create policy "weekly_reports_select_scope" on weekly_reports for select using (
  current_access_level() = 'admin' or is_in_my_team(employee_id)
);
create policy "weekly_reports_write_own_or_admin" on weekly_reports for all using (
  current_access_level() = 'admin' or employee_id = current_employee_id()
) with check (
  current_access_level() = 'admin' or employee_id = current_employee_id()
);

-- ============ evaluations ============
create policy "evaluations_select_scope" on evaluations for select using (
  current_access_level() = 'admin' or is_in_my_team(employee_id)
);
create policy "evaluations_write_scope" on evaluations for all using (
  current_access_level() = 'admin'
  or (current_access_level() = 'gerente' and is_in_my_team(employee_id))
) with check (
  current_access_level() = 'admin'
  or (current_access_level() = 'gerente' and is_in_my_team(employee_id))
);

-- ============ one_on_ones ============
create policy "one_on_ones_select_scope" on one_on_ones for select using (
  current_access_level() = 'admin'
  or is_in_my_team(leader_id) or is_in_my_team(collaborator_id)
  or leader_id = current_employee_id() or collaborator_id = current_employee_id()
);
create policy "one_on_ones_write_scope" on one_on_ones for all using (
  current_access_level() = 'admin'
  or (current_access_level() = 'gerente' and (is_in_my_team(leader_id) or is_in_my_team(collaborator_id)))
) with check (
  current_access_level() = 'admin'
  or (current_access_level() = 'gerente' and (is_in_my_team(leader_id) or is_in_my_team(collaborator_id)))
);

-- ============ development_plans ============
create policy "development_plans_select_scope" on development_plans for select using (
  current_access_level() = 'admin' or is_in_my_team(employee_id)
);
create policy "development_plans_write_scope" on development_plans for all using (
  current_access_level() = 'admin' or is_in_my_team(employee_id)
) with check (
  current_access_level() = 'admin' or is_in_my_team(employee_id)
);

-- ============ recognitions ============
create policy "recognitions_select_all" on recognitions for select using (auth.uid() is not null);
create policy "recognitions_insert_own" on recognitions for insert with check (
  from_id = current_employee_id()
);
create policy "recognitions_delete_own_or_admin" on recognitions for delete using (
  current_access_level() = 'admin' or from_id = current_employee_id()
);
