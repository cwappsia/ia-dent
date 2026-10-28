import { supabasePublico } from '../lib/supabasePublico'
import type { Expediente, Ocupado } from '../lib/slots'

export interface ServicoPublico {
  id: string
  nome: string
  duracao: number
  preco: number | null
}

export interface AgendaPublica {
  clinica: { nome: string; fuso: string; expediente: Expediente; whatsapp: string | null }
  profissional_id: string | null
  servicos: ServicoPublico[]
}

export interface AgendamentoFeito {
  clinica: string
  servico: string
  inicio: string
  fim: string
  whatsapp: string | null
  nome_profissional: string | null
  registro_profissional: string | null
}

function traduzErroPublico(e: unknown): string {
  const msg = String((e as { message?: string })?.message ?? e)
  if (msg.includes('CLINICA_INEXISTENTE')) return 'Clínica não encontrada.'
  if (msg.includes('SERVICO_INDISPONIVEL')) return 'Este serviço não está mais disponível. Recarregue a página.'
  if (msg.includes('SEM_PROFISSIONAL')) return 'A clínica não tem profissional ativo agora. Tente mais tarde.'
  if (msg.includes('FORA_DO_EXPEDIENTE')) return 'Fora do horário de funcionamento. Escolha outro horário.'
  if (msg.includes('HORARIO_PASSADO')) return 'Este horário já passou. Escolha outro.'
  if (msg.includes('HORARIO_OCUPADO')) return 'Este horário acabou de ser preenchido. Escolha outro.'
  if (msg.includes('NOME_INVALIDO')) return 'Informe seu nome completo.'
  if (msg.includes('EMAIL_INVALIDO')) return 'Informe um e-mail válido.'
  if (msg.includes('TELEFONE_INVALIDO')) return 'Informe um telefone válido com DDD.'
  if (msg.includes('sem_sobreposicao') || msg.includes('exclusion'))
    return 'Este horário acabou de ser preenchido. Escolha outro.'
  return 'Algo deu errado. Tente novamente.'
}

async function rpc<T>(funcao: string, params: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabasePublico.rpc(funcao, params)
  if (error) throw new Error(traduzErroPublico(error))
  return data as T
}

/** jsonb devolve numeric como número em REAIS — converte pra centavos uma vez, aqui. */
function paraAgendaPublica(a: AgendaPublica | null): AgendaPublica | null {
  if (!a) return null
  return {
    ...a,
    servicos: a.servicos.map((s) => ({
      ...s,
      preco: s.preco !== null ? Math.round(Number(s.preco) * 100) : null,
    })),
  }
}

export async function carregarAgendaPublica(slug: string): Promise<AgendaPublica | null> {
  return paraAgendaPublica(await rpc<AgendaPublica | null>('agenda_publica', { p_slug: slug }))
}

export function ocupadosDoDia(slug: string, data: string, profissionalId: string | null): Promise<Ocupado[]> {
  return rpc<Ocupado[]>('ocupados_publico', {
    p_slug: slug,
    p_data: data,
    p_profissional: profissionalId,
  })
}

export function agendarPublico(dados: {
  slug: string
  servicoId: string
  inicioIso: string
  nome: string
  email: string
  telefone: string
}): Promise<AgendamentoFeito> {
  return rpc<AgendamentoFeito>('agendar_publico', {
    p_slug: dados.slug,
    p_servico_id: dados.servicoId,
    p_starts_at: dados.inicioIso,
    p_nome: dados.nome,
    p_email: dados.email,
    p_telefone: dados.telefone,
  })
}
