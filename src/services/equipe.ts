import { supabase } from '../lib/supabase'
import type { Membro } from '../types'

export async function clinicAtual(): Promise<string> {
  const { data, error } = await supabase.rpc('clinic_id_do_usuario')
  if (error) throw error
  return String(data)
}

/** Membros da clínica com e-mail (rótulo pro responsável de tarefas). */
export async function listarMembros(): Promise<Membro[]> {
  const { data, error } = await supabase.rpc('listar_membros')
  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    userId: String(row.user_id),
    email: String(row.email),
    papel: row.role as Membro['papel'],
    status: row.status as Membro['status'],
  }))
}
