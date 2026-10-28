-- Dentia 0004 — Pacientes, serviços, tarefas e interações

create table if not exists dentia.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dentia.clinics(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null, -- conta do paciente (F4)
  full_name text not null check (length(btrim(full_name)) >= 2),
  birth_date date,
  cpf text,
  phone text,
  email text,
  origin text not null default 'manual'
    check (origin in ('manual','indicacao','instagram','facebook','google','agendamento_online','outro')),
  status text not null default 'lead'
    check (status in ('lead','ativo','retorno_pendente','inativo')),
  responsible_id uuid references dentia.patients(id) on delete set null,
  notes_admin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- E-mail único por clínica (case-insensitive); NULL é livre (lead sem e-mail)
create unique index patients_email_unico on dentia.patients (clinic_id, lower(email));

create table if not exists dentia.services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dentia.clinics(id) on delete cascade,
  name text not null check (length(btrim(name)) >= 2),
  duration_minutes int not null default 30 check (duration_minutes between 5 and 480),
  price numeric(12,2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, name)
);

create table if not exists dentia.tasks (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dentia.clinics(id) on delete cascade,
  patient_id uuid references dentia.patients(id) on delete cascade,
  assigned_to uuid references dentia.clinic_members(id) on delete set null,
  title text not null check (length(btrim(title)) >= 2),
  due_at date,
  status text not null default 'pendente' check (status in ('pendente','concluida','cancelada')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dentia.interactions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dentia.clinics(id) on delete cascade,
  patient_id uuid not null references dentia.patients(id) on delete cascade,
  type text not null
    check (type in ('ligacao','whatsapp','email','consulta_presencial','visita','outro')),
  summary text not null check (length(btrim(summary)) >= 2),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- updated_at automático
create or replace function dentia.touch_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger touch_patients before update on dentia.patients
  for each row execute function dentia.touch_updated_at();
create trigger touch_services before update on dentia.services
  for each row execute function dentia.touch_updated_at();
create trigger touch_tasks before update on dentia.tasks
  for each row execute function dentia.touch_updated_at();

-- Auditoria de paciente (append-only; sem dado pessoal no log)
create or replace function dentia.auditar_paciente() returns trigger
language plpgsql security definer set search_path = dentia, extensions
as $$
declare
  v_clinic uuid := coalesce(new.clinic_id, old.clinic_id);
  v_id uuid := coalesce(new.id, old.id);
begin
  insert into dentia.audit_logs (clinic_id, actor, action, resource, resource_id)
  values (v_clinic, auth.uid(), lower(tg_op) || '_paciente', 'patients', v_id::text);
  return coalesce(new, old);
end $$;

create trigger auditar_pacientes after insert or update or delete on dentia.patients
  for each row execute function dentia.auditar_paciente();

-- RLS
alter table dentia.patients enable row level security;
alter table dentia.services enable row level security;
alter table dentia.tasks enable row level security;
alter table dentia.interactions enable row level security;

-- Pacientes: equipe CRUD da própria clínica; paciente logado lê só o próprio registro
create policy patients_leitura on dentia.patients
  for select to authenticated
  using (clinic_id = dentia.clinic_id_do_usuario() or user_id = auth.uid());

create policy patients_equipe_insere on dentia.patients
  for insert to authenticated
  with check (clinic_id = dentia.clinic_id_do_usuario());

create policy patients_equipe_edita on dentia.patients
  for update to authenticated
  using (clinic_id = dentia.clinic_id_do_usuario())
  with check (clinic_id = dentia.clinic_id_do_usuario());

create policy patients_equipe_exclui on dentia.patients
  for delete to authenticated
  using (clinic_id = dentia.clinic_id_do_usuario());

-- Serviços, tarefas e interações: equipe full, tudo preso ao tenant
create policy services_equipe on dentia.services
  for all to authenticated
  using (clinic_id = dentia.clinic_id_do_usuario())
  with check (clinic_id = dentia.clinic_id_do_usuario());

create policy tasks_equipe on dentia.tasks
  for all to authenticated
  using (clinic_id = dentia.clinic_id_do_usuario())
  with check (clinic_id = dentia.clinic_id_do_usuario());

create policy interactions_equipe on dentia.interactions
  for all to authenticated
  using (clinic_id = dentia.clinic_id_do_usuario())
  with check (clinic_id = dentia.clinic_id_do_usuario());

-- Explicitamente fechado pra anon (superfície anônima nasce na F4)
revoke all on dentia.patients, dentia.services, dentia.tasks, dentia.interactions from anon, public;
grant select, insert, update, delete on dentia.patients, dentia.services, dentia.tasks, dentia.interactions to authenticated;

-- Membros com e-mail (rótulo pro responsável da tarefa); auth.users não é exposto no REST,
-- então o acesso passa por RPC security definer com gate de tenant.
create or replace function dentia.listar_membros()
returns table (id uuid, user_id uuid, email text, role text, status text)
language sql stable security definer set search_path = dentia, extensions
as $$
  select m.id, m.user_id, u.email, m.role, m.status
  from dentia.clinic_members m
  join auth.users u on u.id = m.user_id
  where m.clinic_id = dentia.clinic_id_do_usuario()
  order by m.created_at
$$;

revoke execute on function dentia.listar_membros() from public, anon;
grant execute on function dentia.listar_membros() to authenticated;
