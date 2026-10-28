import { supabase } from '../lib/supabase'
import { centavosDoBanco, centavosParaBanco } from '../lib/dinheiro'
import { clinicAtual } from './equipe'
import type { Servico, ServicoInput } from '../types'

const CAMPOS = 'id, clinic_id, name, duration_minutes, price, active, created_at'

function mapServico(row: Record<string, unknown>): Servico {
  return {
    id: String(row.id),
    clinicId: String(row.clinic_id),
    nome: String(row.name),
    duracaoMin: Number(row.duration_minutes),
    precoCentavos: centavosDoBanco(row.price === null ? null : Number(row.price)),
    ativo: Boolean(row.active),
    criadoEm: String(row.created_at),
  }
}

function paraRow(dados: ServicoInput): Record<string, unknown> {
  return {
    name: dados.nome.trim(),
    duration_minutes: dados.duracaoMin,
    price: centavosParaBanco(dados.precoCentavos),
    active: dados.ativo,
  }
}

export async function listarServicos(): Promise<Servico[]> {
  const { data, error } = await supabase
    .from('services')
    .select(CAMPOS)
    .order('name', { ascending: true })
    .limit(200)
  if (error) throw error
  return (data ?? []).map(mapServico)
}

export async function criarServico(dados: ServicoInput): Promise<void> {
  const { error } = await supabase.from('services').insert({ ...paraRow(dados), clinic_id: await clinicAtual() })
  if (error) throw error
}

export async function atualizarServico(id: string, dados: ServicoInput): Promise<void> {
  const { error } = await supabase.from('services').update(paraRow(dados)).eq('id', id)
  if (error) throw error
}
