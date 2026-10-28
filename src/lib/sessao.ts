// Tipos e regras puras da sessão — sem React, sem Supabase (testável em node)

export type Papel = 'owner' | 'dentist' | 'receptionist'

export interface Clinica {
  id: string
  name: string
  slug: string
  status: 'ativa' | 'pausada'
  timezone: string
  horario_padrao: { dias: number[]; inicio: string; fim: string }
  duracao_padrao_consulta: number
  whatsapp: string | null
  nome_profissional: string | null
  registro_profissional: string | null
}

export type FaseSessao =
  | { fase: 'carregando' }
  | { fase: 'sem-usuario' }
  | { fase: 'sem-clinica'; userId: string }
  | { fase: 'equipe'; userId: string; papel: Papel; clinica: Clinica }
  | { fase: 'paciente'; userId: string; patientId: string }

export type Destino = 'login' | 'app' | 'portal' | 'onboarding'

/** Roteamento pós-login por papel: equipe → app, paciente → portal, sem clínica → onboarding. */
export function resolverDestino(fase: FaseSessao): Destino {
  switch (fase.fase) {
    case 'carregando':
    case 'sem-usuario':
      return 'login'
    case 'equipe':
      return 'app'
    case 'paciente':
      return 'portal'
    case 'sem-clinica':
      return 'onboarding'
  }
}

const ROTAS_DESTINO: Record<Destino, string> = {
  login: '/login',
  app: '/',
  portal: '/meus-agendamentos',
  onboarding: '/onboarding',
}

export function rotaDoDestino(destino: Destino): string {
  return ROTAS_DESTINO[destino]
}

/** Traduz erros do Supabase/RPC em mensagens humanas; nada de jargão pro usuário. */
export function traduzErro(e: unknown): string {
  const msg =
    e instanceof Error
      ? e.message
      : e && typeof e === 'object' && 'message' in e
        ? String((e as { message?: unknown }).message ?? '')
        : ''
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.'
  if (/user already registered/i.test(msg)) return 'Este e-mail já tem uma conta. Entre para continuar.'
  if (/email not confirmed/i.test(msg)) return 'Confirme seu e-mail antes de entrar.'
  if (msg.includes('JA_TEM_CLINICA')) return 'Você já faz parte de uma clínica.'
  if (msg.includes('ACEITE_OBRIGATORIO')) return 'Você precisa aceitar os termos para criar a clínica.'
  if (msg.includes('NOME_INVALIDO')) return 'Informe um nome com pelo menos 2 letras.'
  if (msg.includes('SLUG_INDISPONIVEL')) return 'Não foi possível gerar um link para este nome. Tente outro nome.'
  if (msg.includes('CONVITE_INVALIDO')) return 'Código de convite inválido ou expirado.'
  if (msg.includes('NAO_AUTENTICADO')) return 'Sua sessão expirou. Entre novamente.'
  if (msg.includes('patients_email_unico'))
    return 'Já existe um paciente com este e-mail nesta clínica.'
  if (msg.includes('services_clinic_id_name_key'))
    return 'Já existe um serviço com este nome. Edite o existente ou use outro nome.'
  if (msg.includes('sem_sobreposicao'))
    return 'Já existe uma consulta ou bloqueio nesse horário para este profissional.'
  if (msg.includes('horario_valido')) return 'O fim precisa ser depois do início.'
  if (msg.includes('clinics_slug_key'))
    return 'Este link de agendamento já está em uso por outra clínica. Escolha outro.'
  if (/row-level security/i.test(msg))
    return 'Seu papel não permite essa alteração.'
  if (/duplicate key/i.test(msg)) return 'Este registro já existe.'
  return 'Algo deu errado. Tente novamente.'
}
