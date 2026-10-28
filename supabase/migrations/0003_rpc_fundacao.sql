-- Dentia 0003 — RPCs de clínica e convite

create or replace function dentia.criar_clinica(p_nome text, p_aceite_termos boolean default false)
returns uuid
language plpgsql
security definer
set search_path = dentia, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_slug text;
  v_base text;
  v_n int := 1;
begin
  if v_user is null then
    raise exception 'NAO_AUTENTICADO';
  end if;
  if coalesce(p_aceite_termos, false) is not true then
    raise exception 'ACEITE_OBRIGATORIO';
  end if;
  if length(btrim(coalesce(p_nome, ''))) < 2 then
    raise exception 'NOME_INVALIDO';
  end if;

  -- MVP: 1 clínica por usuário — qualquer membership (ativa ou não) bloqueia
  if exists (select 1 from dentia.clinic_members where user_id = v_user) then
    raise exception 'JA_TEM_CLINICA';
  end if;

  v_base := regexp_replace(
    translate(lower(btrim(p_nome)),
      'áàâãäéèêëíìîïóòôõöúùûüçñ',
      'aaaaaeeeeiiiiooooouuuucn'),
    '[^a-z0-9]+', '-', 'g');
  v_base := btrim(v_base, '-');
  if coalesce(v_base, '') = '' then
    v_base := 'clinica';
  end if;

  loop
    begin
      insert into dentia.clinics (name, slug)
      values (btrim(p_nome), case when v_n = 1 then v_base else v_base || '-' || v_n end)
      returning id into v_id;
      exit;
    exception when unique_violation then
      v_n := v_n + 1;
      if v_n > 50 then
        raise exception 'SLUG_INDISPONIVEL';
      end if;
    end;
  end loop;

  insert into dentia.clinic_members (clinic_id, user_id, role)
  values (v_id, v_user, 'owner');

  insert into dentia.audit_logs (clinic_id, actor, action, resource, resource_id)
  values (v_id, v_user, 'criar_clinica', 'clinics', v_id::text);

  return v_id;
end $$;

create or replace function dentia.aceitar_convite(p_codigo text)
returns void
language plpgsql
security definer
set search_path = dentia, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_inv dentia.clinic_invites%rowtype;
begin
  if v_user is null then
    raise exception 'NAO_AUTENTICADO';
  end if;

  -- MVP: 1 clínica por usuário
  if exists (select 1 from dentia.clinic_members where user_id = v_user) then
    raise exception 'JA_TEM_CLINICA';
  end if;

  select * into v_inv
  from dentia.clinic_invites
  where upper(btrim(coalesce(p_codigo, ''))) = upper(code)
    and used_at is null
    and expires_at > now();

  if not found then
    raise exception 'CONVITE_INVALIDO';
  end if;

  insert into dentia.clinic_members (clinic_id, user_id, role)
  values (v_inv.clinic_id, v_user, v_inv.role);

  update dentia.clinic_invites set used_at = now() where id = v_inv.id;

  insert into dentia.audit_logs (clinic_id, actor, action, resource, resource_id)
  values (v_inv.clinic_id, v_user, 'aceitar_convite', 'clinic_invites', v_inv.id::text);
end $$;

revoke execute on function dentia.criar_clinica(text, boolean) from public, anon;
revoke execute on function dentia.aceitar_convite(text) from public, anon;
grant execute on function dentia.criar_clinica(text, boolean) to authenticated;
grant execute on function dentia.aceitar_convite(text) to authenticated;
