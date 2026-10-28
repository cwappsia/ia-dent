import { supabase } from '../lib/supabase'
import { clinicAtual } from './equipe'
import { limparTelefone } from '../lib/telefone'
import { textoOuNull } from '../lib/datas'
import type { Clinica } from '../lib/sessao'

export interface ConfigClinicaInput {
  whatsapp: string | null
  slug: string
  horarioPadrao: { dias: number[]; inicio: string; fim: string }
  duracaoPadraoConsulta: number
  nomeProfissional: string | null
  registroProfissional: string | null
}

/** Só o owner passa pela RLS (clinics_owner_edita); o banco é a barreira real. */
export async function atualizarClinica(dados: ConfigClinicaInput): Promise<void> {
  const { error } = await supabase
    .from('clinics')
    .update({
      whatsapp: textoOuNull(limparTelefone(dados.whatsapp)),
      slug: dados.slug.trim().toLowerCase(),
      horario_padrao: dados.horarioPadrao,
      duracao_padrao_consulta: dados.duracaoPadraoConsulta,
      nome_profissional: dados.nomeProfissional,
      registro_profissional: dados.registroProfissional,
    })
    .eq('id', await clinicAtual())
  if (error) throw error
}

export type { Clinica }