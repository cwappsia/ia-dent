-- Dentia 0005 — Agenda: consultas, bloqueios, anti-conflito no banco, conversão lead→ativo

create extension if not exists btree_gist;

-- Helper: patients.id do usuário logado (paciente do portal, F4)
create or replace function dentia.patient_id_do_usuario() returns uuid
language sql stable security definer set search_path = dentia, extensions
as $$
  select p.id
  from dentia.patients p
  where p.user_id = auth.uid()
  limit 1
$$;

revoke execute on function dentia.patient_id_do_usuario() from public, anon;
grant execute on function dentia.patient_id_do_usuario() to authenticated;

create table if not exists dentia.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dentia.clinics(id) on delete cascade,
  patient_id uuid references dentia.patients(id) on delete set null,
  professional_id uuid references dentia.clinic_members(id) on delete set null,
  service_id uuid references dentia.services(id) on delete set null,
  kind text not null default 'consulta' check (kind in ('consulta','bloqueio')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'agendado'
    check (status in ('agendado','confirmado','atendido','faltou','cancelado')),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint horario_valido check (ends_at > starts_at),
  constraint bloqueio_sem_paciente check (kind = 'consulta' or patient_id is null),
  -- Anti-conflito REAL: mesmo profissional, mesma clínica, horários que se cruzam.
  -- Cancelado/atendido/faltou liberam a vaga (não participam do índice).
  constraint sem_sobreposicao exclude using gist (
    clinic_id with =,
    professional_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('agendado','confirmado'))
);

create trigger touch_appointments before update on dentia.appointments
  for each row execute function dentia.touch_updated_at();

-- Auditoria de consulta (append-only; sem dado pessoal no log)
create or replace function dentia.auditar_consulta() returns trigger
language plpgsql security definer set search_path = dentia, extensions
as $$
declare
  v_clinic uuid := coalesce(new.clinic_id, old.clinic_id);
  v_id uuid := coalesce(new.id, old.id);
begin
  insert into dentia.audit_logs (clinic_id, actor, action, resource, resource_id)
  values (v_clinic, auth.uid(), lower(tg_op) || '_consulta', 'appointments', v_id::text);
  return coalesce(new, old);
end $$;

create trigger auditar_consultas after insert or update or delete on dentia.appointments
  for each row execute function dentia.auditar_consulta();

-- Conversão automática do funil: 1ª consulta ATENDIDA promove lead → ativo (no banco)
create or replace function dentia.converter_lead_atendido() returns trigger
language plpgsql security definer set search_path = dentia, extensions
as $$
begin
  if new.status = 'atendido' and new.patient_id is not null then
    update dentia.patients
    set status = 'ativo'
    where id = new.patient_id and status = 'lead';
  end if;
  return new;
end $$;

create trigger converter_lead_apos_consulta after update of status on dentia.appointments
  for each row execute function dentia.converter_lead_atendido();

-- RLS: equipe full; paciente lê só as próprias; DELETE não existe pra ninguém
-- (cancelamento e falta ficam registrados — a UI nunca apaga consulta)
alter table dentia.appointments enable row level security;

create policy appointments_leitura on dentia.appointments
  for select to authenticated
  using (clinic_id = dentia.clinic_id_do_usuario() or patient_id = dentia.patient_id_do_usuario());

create policy appointments_equipe_insere on dentia.appointments
  for insert to authenticated
  with check (clinic_id = dentia.clinic_id_do_usuario());

create policy appointments_equipe_edita on dentia.appointments
  for update to authenticated
  using (clinic_id = dentia.clinic_id_do_usuario())
  with check (clinic_id = dentia.clinic_id_do_usuario());

revoke all on dentia.appointments from anon, public;
grant select, insert, update on dentia.appointments to authenticated;
