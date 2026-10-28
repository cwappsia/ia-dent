import { supabase } from '../lib/supabase'
import { clinicAtual } from './equipe'
import type { Consulta, StatusConsulta } from '../types'

const CAMPOS =
  'id, patient_id, patients(full_name), professional_id, service_id, services(name), kind, starts_at, ends_at, status, reason, created_at'

function mapConsulta(row: Record<string, unknown>): Consulta {
  const paciente = row.patients as Record<string, unknown> | null
  const servico = row.services as Record<string, unknown> | null
  return {
    id: String(row.id),
    pacienteId: row.patient_id ? String(row.patient_id) : null,
    pacienteNome: paciente?.full_name ? String(paciente.full_name) : null,
    profissionalId: row.professional_id ? String(row.professional_id) : null,
    servicoId: row.service_id ? String(row.service_id) : null,
    servicoNome: servico?.name ? String(servico.name) : null,
    tipo: row.kind as Consulta['tipo'],
    inicio: String(row.starts_at),
    fim: String(row.ends_at),
    status: row.status as StatusConsulta,
    motivo: row.reason ? String(row.reason) : null,
    criadoEm: String(row.created_at),
  }
}

/** Consultas e bloqueios de uma faixa [de, ate) para um profissional. */
export async function listarAgenda(
  de: string,
  ate: string,
  profissionalId: string,
): Promise<Consulta[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(CAMPOS)
    .gte('starts_at', de)
    .lt('starts_at', ate)
    .eq('professional_id', profissionalId)
    .order('starts_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapConsulta)
}

/** Agenda do dia inteiro da clínica (todos os profissionais) — pro dashboard. */
export async function listarAgendaDaClinica(de: string, ate: string): Promise<Consulta[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(CAMPOS)
    .gte('starts_at', de)
    .lt('starts_at', ate)
    .order('starts_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapConsulta)
}

/** Histórico do paciente (timeline) — todos os status, mais recente primeiro. */
export async function consultasDoPaciente(pacienteId: string): Promise<Consulta[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(CAMPOS)
    .eq('patient_id', pacienteId)
    .order('starts_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []).map(mapConsulta)
}

export interface ConsultaInput {
  pacienteId: string
  profissionalId: string
  servicoId: string | null
  motivo: string | null
  inicioIso: string
  fimIso: string
  status: StatusConsulta
}

export async function criarConsulta(dados: ConsultaInput): Promise<Consulta> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      clinic_id: await clinicAtual(),
      patient_id: dados.pacienteId,
      professional_id: dados.profissionalId,
      service_id: dados.servicoId,
      kind: 'consulta',
      starts_at: dados.inicioIso,
      ends_at: dados.fimIso,
      status: dados.status,
      reason: dados.motivo,
    })
    .select(CAMPOS)
    .single()
  if (error) throw error
  return mapConsulta(data)
}

export async function atualizarConsulta(id: string, dados: ConsultaInput): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({
      patient_id: dados.pacienteId,
      professional_id: dados.profissionalId,
      service_id: dados.servicoId,
      starts_at: dados.inicioIso,
      ends_at: dados.fimIso,
      status: dados.status,
      reason: dados.motivo,
    })
    .eq('id', id)
  if (error) throw error
}

export async function criarBloqueio(
  profissionalId: string,
  titulo: string,
  inicioIso: string,
  fimIso: string,
): Promise<void> {
  const { error } = await supabase.from('appointments').insert({
    clinic_id: await clinicAtual(),
    professional_id: profissionalId,
    kind: 'bloqueio',
    starts_at: inicioIso,
    ends_at: fimIso,
    reason: titulo,
  })
  if (error) throw error
}