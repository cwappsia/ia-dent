-- Dentia 0007 — Portal do paciente: vínculo da conta aos pacientes por e-mail + leitura das próprias consultas

-- Liga o usuário logado aos patients com o mesmo e-mail (o lead do agendamento
-- público nasce sem user_id; quando ele cria conta com o MESMO e-mail, casa aqui).
-- Idempotente: só mexe em patients ainda sem user_id. Membro de clínica vence
-- no front (equipe é resolvido antes de paciente).
create or replace function dentia.vincular_paciente_conta() returns int
language sql security definer set search_path = dentia, extensions
as $$
  with vinculados as (
    update dentia.patients p
    set user_id = auth.uid(), updated_at = now()
    where p.user_id is null
      and lower(p.email) = lower((select u.email from auth.users u where u.id = auth.uid()))
    returning 1
  )
  select count(*)::int from vinculados
$$;

-- Consultas do paciente logado (todas as clínicas onde é paciente), prontas pro portal.
create or replace function dentia.minhas_consultas() returns jsonb
language sql stable security definer set search_path = dentia, extensions
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id,
    'clinica', c.name,
    'slug', c.slug,
    'fuso', c.timezone,
    'servico', s.name,
    'inicio', a.starts_at,
    'fim', a.ends_at,
    'status', a.status
  ) order by a.starts_at desc), '[]'::jsonb)
  from dentia.appointments a
  join dentia.patients p on p.id = a.patient_id and p.user_id = auth.uid()
  join dentia.clinics c on c.id = a.clinic_id
  left join dentia.services s on s.id = a.service_id
  where a.kind = 'consulta'
$$;

revoke execute on function dentia.vincular_paciente_conta() from public, anon;
revoke execute on function dentia.minhas_consultas() from public, anon;
grant execute on function dentia.vincular_paciente_conta() to authenticated;
grant execute on function dentia.minhas_consultas() to authenticated;
