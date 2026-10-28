-- Dentia 0002 — Helpers de tenant + RLS

-- Helper: clínica ATIVA do usuário logado (membro ativo).
-- Kill switch do futuro painel: clínica pausada ou membro inativo não resolve.
create or replace function dentia.clinic_id_do_usuario() returns uuid
language sql stable security definer set search_path = dentia, extensions
as $$
  select m.clinic_id
  from dentia.clinic_members m
  join dentia.clinics c on c.id = m.clinic_id
  where m.user_id = auth.uid()
    and m.status = 'ativo'
    and c.status = 'ativa'
  order by m.created_at
  limit 1
$$;

create or replace function dentia.papel_do_usuario() returns text
language sql stable security definer set search_path = dentia, extensions
as $$
  select m.role
  from dentia.clinic_members m
  join dentia.clinics c on c.id = m.clinic_id
  where m.user_id = auth.uid()
    and m.status = 'ativo'
    and c.status = 'ativa'
  order by m.created_at
  limit 1
$$;

create or replace function dentia.tem_papel(p_papeis text[]) returns boolean
language sql stable security definer set search_path = dentia, extensions
as $$
  select coalesce(dentia.papel_do_usuario() = any (p_papeis), false)
$$;

-- Função nova nasce EXECUTÁVEL pra PUBLIC (default do banco): fechar e dar acesso só a quem usa
revoke execute on function dentia.clinic_id_do_usuario() from public, anon;
revoke execute on function dentia.papel_do_usuario() from public, anon;
revoke execute on function dentia.tem_papel(text[]) from public, anon;
grant execute on function dentia.clinic_id_do_usuario() to authenticated;
grant execute on function dentia.papel_do_usuario() to authenticated;
grant execute on function dentia.tem_papel(text[]) to authenticated;

-- RLS em toda tabela multi-usuário
alter table dentia.clinics enable row level security;
alter table dentia.clinic_members enable row level security;
alter table dentia.clinic_invites enable row level security;
alter table dentia.audit_logs enable row level security;

-- clinics: equipe lê a própria clínica; owner edita; inserir/delete só via RPC
create policy clinics_leitura on dentia.clinics
  for select to authenticated
  using (id = dentia.clinic_id_do_usuario());

create policy clinics_owner_edita on dentia.clinics
  for update to authenticated
  using (id = dentia.clinic_id_do_usuario() and dentia.papel_do_usuario() = 'owner')
  with check (id = dentia.clinic_id_do_usuario() and dentia.papel_do_usuario() = 'owner');

-- clinic_members: equipe vê os membros da clínica; owner edita (papel/status)
create policy members_leitura on dentia.clinic_members
  for select to authenticated
  using (clinic_id = dentia.clinic_id_do_usuario());

create policy members_owner_edita on dentia.clinic_members
  for update to authenticated
  using (clinic_id = dentia.clinic_id_do_usuario() and dentia.papel_do_usuario() = 'owner')
  with check (clinic_id = dentia.clinic_id_do_usuario() and dentia.papel_do_usuario() = 'owner');

-- clinic_invites: owner lê os convites da clínica
create policy invites_owner_le on dentia.clinic_invites
  for select to authenticated
  using (clinic_id = dentia.clinic_id_do_usuario() and dentia.papel_do_usuario() = 'owner');

-- audit_logs: RLS ligado, ZERO policies — negado qualquer acesso direto;
-- append-only garantido por ausência de grants de update/delete.
