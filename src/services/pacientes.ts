import { supabase } from '../lib/supabase'
import { dataOuNull, textoOuNull } from '../lib/datas'
import { limparCpf } from '../lib/cpf'
import { limparTelefone } from '../lib/telefone'
import { clinicAtual } from './equipe'
import { consultasDoPaciente } from './agenda'
import type { Interacao, ItemTimeline, Paciente, PacienteInput, Tarefa } from '../types'

const CAMPOS =
  'id, clinic_id, user_id, full_name, birth_date, cpf, phone, email, origin, status, responsible_id, notes_admin, created_at'

function mapPaciente(row: Record<string, unknown>): Paciente {
  return {
    id: String(row.id),
    clinicId: String(row.clinic_id),
    userId: row.user_id ? String(row.user_id) : null,
    nome: String(row.full_name),
    nascimento: row.birth_date ? String(row.birth_date) : null,
    cpf: row.cpf ? String(row.cpf) : null,
    telefone: row.phone ? String(row.phone) : null,
    email: row.email ? String(row.email) : null,
    origem: row.origin as Paciente['origem'],
    status: row.status as Paciente['status'],
    responsavelId: row.responsible_id ? String(row.responsible_id) : null,
    observacao: row.notes_admin ? String(row.notes_admin) : null,
    criadoEm: String(row.created_at),
  }
}

function paraRow(dados: PacienteInput): Record<string, unknown> {
  return {
    full_name: dados.nome.trim(),
    birth_date: dataOuNull(dados.nascimento),
    cpf: textoOuNull(limparCpf(dados.cpf)),
    phone: textoOuNull(limparTelefone(dados.telefone)),
    email: dados.email ? dados.email.trim().toLowerCase() : null,
    origin: dados.origem,
    status: dados.status,
    responsible_id: dados.responsavelId,
    notes_admin: textoOuNull(dados.observacao),
  }
}

export async function listarPacientes(): Promise<Paciente[]> {
  const { data, error } = await supabase
    .from('patients')
    .select(CAMPOS)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []).map(mapPaciente)
}

export async function buscarPaciente(id: string): Promise<Paciente | null> {
  const { data, error } = await supabase.from('patients').select(CAMPOS).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapPaciente(data) : null
}

export async function criarPaciente(dados: PacienteInput): Promise<Paciente> {
  const { data, error } = await supabase
    .from('patients')
    .insert({ ...paraRow(dados), clinic_id: await clinicAtual() })
    .select(CAMPOS)
    .single()
  if (error) throw error
  return mapPaciente(data)
}

export async function atualizarPaciente(id: string, dados: PacienteInput): Promise<void> {
  const { error } = await supabase.from('patients').update(paraRow(dados)).eq('id', id)
  if (error) throw error
}

export async function excluirPaciente(id: string): Promise<void> {
  const { error } = await supabase.from('patients').delete().eq('id', id)
  if (error) throw error
}

function mapInteracao(row: Record<string, unknown>): Interacao {
  return {
    id: String(row.id),
    pacienteId: String(row.patient_id),
    tipo: row.type as Interacao['tipo'],
    resumo: String(row.summary),
    criadoEm: String(row.created_at),
  }
}

function mapTarefa(row: Record<string, unknown>): Tarefa {
  return {
    id: String(row.id),
    pacienteId: row.patient_id ? String(row.patient_id) : null,
    responsavelId: row.assigned_to ? String(row.assigned_to) : null,
    titulo: String(row.title),
    prazo: row.due_at ? String(row.due_at) : null,
    status: row.status as Tarefa['status'],
    criadoEm: String(row.created_at),
  }
}

/** Timeline do paciente: interações, tarefas e consultas juntas, mais recente primeiro. */
export async function carregarTimeline(pacienteId: string): Promise<ItemTimeline[]> {
  const [interacoes, tarefas, consultas] = await Promise.all([
    supabase
      .from('interactions')
      .select('id, patient_id, type, summary, created_at')
      .eq('patient_id', pacienteId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('tasks')
      .select('id, patient_id, assigned_to, title, due_at, status, created_at')
      .eq('patient_id', pacienteId)
      .order('created_at', { ascending: false })
      .limit(100),
    consultasDoPaciente(pacienteId),
  ])
  if (interacoes.error) throw interacoes.error
  if (tarefas.error) throw tarefas.error
  const itens: ItemTimeline[] = [
    ...(interacoes.data ?? []).map((row) => ({ tipo: 'interacao' as const, item: mapInteracao(row) })),
    ...(tarefas.data ?? []).map((row) => ({ tipo: 'tarefa' as const, item: mapTarefa(row) })),
    ...consultas.map((c) => ({ tipo: 'consulta' as const, item: c })),
  ]
  const dataDe = (i: ItemTimeline) => (i.tipo === 'consulta' ? i.item.inicio : i.item.criadoEm)
  return itens.sort((a, b) => dataDe(b).localeCompare(dataDe(a)))
}

export async function criarInteracao(
  pacienteId: string,
  tipo: Interacao['tipo'],
  resumo: string,
): Promise<void> {
  const { error } = await supabase.from('interactions').insert({
    clinic_id: (await clinicAtual()),
    patient_id: pacienteId,
    type: tipo,
    summary: resumo.trim(),
  })
  if (error) throw error
}

export async function criarTarefa(
  pacienteId: string,
  titulo: string,
  responsavelId: string | null,
  prazo: string | null,
): Promise<void> {
  const { error } = await supabase.from('tasks').insert({
    clinic_id: (await clinicAtual()),
    patient_id: pacienteId,
    assigned_to: responsavelId,
    title: titulo.trim(),
    due_at: dataOuNull(prazo),
  })
  if (error) throw error
}

export async function atualizarStatusTarefa(id: string, status: Tarefa['status']): Promise<void> {
  const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
  if (error) throw error
}

// ---- Dashboard ----

export interface LeadResumo {
  id: string
  nome: string
  criadoEm: string
}

/** Leads novos dos últimos N dias (funil de agendamento). */
export async function listarLeadsRecentes(dias = 7): Promise<LeadResumo[]> {
  const desde = new Date(Date.now() - dias * 86400000).toISOString()
  const { data, error } = await supabase
    .from('patients')
    .select('id, full_name, created_at')
    .eq('status', 'lead')
    .gte('created_at', desde)
    .order('created_at', { ascending: false })
    .limit(7)
  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    nome: String(row.full_name),
    criadoEm: String(row.created_at),
  }))
}

export interface TarefaPendente {
  id: string
  titulo: string
  prazo: string | null // YYYY-MM-DD
  pacienteNome: string | null
}

/** Tarefas pendentes da clínica, mais urgentes primeiro (sem prazo no fim). */
export async function tarefasPendentes(): Promise<TarefaPendente[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, due_at, patients(full_name)')
    .eq('status', 'pendente')
    .order('due_at', { ascending: true, nullsFirst: false })
    .limit(7)
  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => {
    const paciente = row.patients as Record<string, unknown> | null
    return {
      id: String(row.id),
      titulo: String(row.title),
      prazo: row.due_at ? String(row.due_at) : null,
      pacienteNome: paciente?.full_name ? String(paciente.full_name) : null,
    }
  })
}
