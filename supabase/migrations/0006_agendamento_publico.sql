-- Dentia 0006 — Agendamento online público: superfície anônima mínima (security definer)
-- O anônimo NÃO ganha grants em tabelas; entra SÓ por estas 3 funções.

-- Dados pra montar a tela: clínica (por slug), primeiro profissional ativo, serviços ativos
create or replace function dentia.agenda_publica(p_slug text) returns jsonb
language sql stable security definer set search_path = dentia, extensions
as $$
  select jsonb_build_object(
    'clinica', jsonb_build_object(
      'nome', c.name,
      'fuso', c.timezone,
      'expediente', c.horario_padrao,
      'whatsapp', c.whatsapp
    ),
    'profissional_id', (
      select m.id from dentia.clinic_members m
      where m.clinic_id = c.id and m.status = 'ativo' and m.role in ('owner','dentist')
      order by m.created_at limit 1
    ),
    'servicos', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'nome', s.name, 'duracao', s.duration_minutes, 'preco', s.price) order by s.name)
      from dentia.services s
      where s.clinic_id = c.id and s.active
    ), '[]'::jsonb)
  )
  from dentia.clinics c
  where lower(c.slug) = lower(p_slug) and c.status = 'ativa'
$$;

-- Horários já ocupados no dia (pro front filtrar os slots)
create or replace function dentia.ocupados_publico(p_slug text, p_data date, p_profissional uuid default null) returns jsonb
language sql stable security definer set search_path = dentia, extensions
as $$
  select coalesce(jsonb_agg(jsonb_build_object('i', a.starts_at, 'f', a.ends_at) order by a.starts_at), '[]'::jsonb)
  from dentia.appointments a
  join dentia.clinics c on c.id = a.clinic_id
  where lower(c.slug) = lower(p_slug)
    and a.starts_at >= (p_data::timestamp at time zone c.timezone)
    and a.starts_at < ((p_data + 1)::timestamp at time zone c.timezone)
    and a.status in ('agendado','confirmado')
    and (p_profissional is null or a.professional_id = p_profissional)
$$;

-- O agendamento em si: cria/atualiza o lead e marca a consulta numa transação.
-- O EXCLUDE de appointments é a barreira real de conflito (23P01 se horário tomado).
create or replace function dentia.agendar_publico(
  p_slug text,
  p_servico_id uuid,
  p_starts_at timestamptz,
  p_nome text,
  p_email text,
  p_telefone text
) returns jsonb
language plpgsql security definer set search_path = dentia, extensions
as $$
declare
  v_clinic dentia.clinics%rowtype;
  v_servico dentia.services%rowtype;
  v_prof uuid;
  v_paciente uuid;
  v_duracao int;
  v_fim timestamptz;
  v_dow int;
  v_zap text;
begin
  -- validação na fronteira (anônimo não é confiável)
  if length(btrim(p_nome)) < 2 then raise exception 'NOME_INVALIDO'; end if;
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'EMAIL_INVALIDO'; end if;
  if p_telefone is null or length(regexp_replace(p_telefone, '\D', '', 'g')) not between 10 and 13 then
    raise exception 'TELEFONE_INVALIDO';
  end if;
  if p_starts_at <= now() then raise exception 'HORARIO_PASSADO'; end if;

  select * into v_clinic from dentia.clinics c
  where lower(c.slug) = lower(p_slug) and c.status = 'ativa';
  if not found then raise exception 'CLINICA_INEXISTENTE'; end if;

  select * into v_servico from dentia.services s
  where s.id = p_servico_id and s.clinic_id = v_clinic.id and s.active;
  if not found then raise exception 'SERVICO_INDISPONIVEL'; end if;

  select m.id into v_prof from dentia.clinic_members m
  where m.clinic_id = v_clinic.id and m.status = 'ativo' and m.role in ('owner','dentist')
  order by m.created_at limit 1;
  if v_prof is null then raise exception 'SEM_PROFISSIONAL'; end if;

  -- expediente: dia da semana e janela, no fuso da clínica
  v_dow := extract(isodow from (p_starts_at at time zone v_clinic.timezone))::int;
  if not ((v_clinic.horario_padrao->'dias') @> to_jsonb(v_dow)) then
    raise exception 'FORA_DO_EXPEDIENTE';
  end if;
  v_duracao := v_servico.duration_minutes;
  v_fim := p_starts_at + make_interval(mins => v_duracao);
  if (p_starts_at at time zone v_clinic.timezone)::time < (v_clinic.horario_padrao->>'inicio')::time
     or (v_fim at time zone v_clinic.timezone)::time > (v_clinic.horario_padrao->>'fim')::time then
    raise exception 'FORA_DO_EXPEDIENTE';
  end if;

  -- lead: nasce lead/origem agendamento_online; e-mail existente reagenda
  -- (ponytail: quem tem o e-mail controla o cadastro — ownership por token de e-mail é upgrade futuro)
  insert into dentia.patients (clinic_id, full_name, email, phone, status, origin)
  values (v_clinic.id, btrim(p_nome), lower(p_email), regexp_replace(p_telefone, '\D', '', 'g'), 'lead', 'agendamento_online')
  on conflict (clinic_id, lower(email)) do update
    set full_name = excluded.full_name, phone = excluded.phone, updated_at = now()
  returning id into v_paciente;

  insert into dentia.appointments (clinic_id, patient_id, professional_id, service_id, kind, starts_at, ends_at, status)
  values (v_clinic.id, v_paciente, v_prof, v_servico.id, 'consulta', p_starts_at, v_fim, 'agendado');

  return jsonb_build_object(
    'clinica', v_clinic.name,
    'servico', v_servico.name,
    'inicio', p_starts_at,
    'fim', v_fim,
    'whatsapp', v_clinic.whatsapp
  );
end $$;

revoke execute on function dentia.agenda_publica(text) from public, authenticated;
revoke execute on function dentia.ocupados_publico(text, date, uuid) from public, authenticated;
revoke execute on function dentia.agendar_publico(text, uuid, timestamptz, text, text, text) from public, authenticated;
grant execute on function dentia.agenda_publica(text) to anon;
grant execute on function dentia.ocupados_publico(text, date, uuid) to anon;
grant execute on function dentia.agendar_publico(text, uuid, timestamptz, text, text, text) to anon;
