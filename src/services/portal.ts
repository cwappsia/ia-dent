import { supabase } from '../lib/supabase'
import type { StatusConsulta } from '../types'

export interface ConsultaPortal {
  id: string
  clinica: string
  slug: string
  fuso: string
  servico: string | null
  inicio: string
  fim: string
  status: StatusConsulta
}

/** Consultas do paciente logado (RPC security definer — todas as clínicas onde é paciente). */
export async function minhasConsultas(): Promise<ConsultaPortal[]> {
  const { data, error } = await supabase.rpc('minhas_consultas')
  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    clinica: String(row.clinica),
    slug: String(row.slug),
    fuso: String(row.fuso),
    servico: row.servico ? String(row.servico) : null,
    inicio: String(row.inicio),
    fim: String(row.fim),
    status: row.status as StatusConsulta,
  }))
}
