// Tipos de domínio (snake_case do banco nunca vaza das services)

export type Papel = 'owner' | 'dentist' | 'receptionist'

export type StatusPaciente = 'lead' | 'ativo' | 'retorno_pendente' | 'inativo'
export type OrigemPaciente =
  | 'manual'
  | 'indicacao'
  | 'instagram'
  | 'facebook'
  | 'google'
  | 'agendamento_online'
  | 'outro'

export const ORIGENS: { valor: OrigemPaciente; rotulo: string }[] = [
  { valor: 'manual', rotulo: 'Cadastro manual' },
  { valor: 'indicacao', rotulo: 'Indicação' },
  { valor: 'instagram', rotulo: 'Instagram' },
  { valor: 'facebook', rotulo: 'Facebook' },
  { valor: 'google', rotulo: 'Google' },
  { valor: 'agendamento_online', rotulo: 'Agendamento online' },
  { valor: 'outro', rotulo: 'Outro' },
]

export const STATUS_PACIENTE: { valor: StatusPaciente; rotulo: string }[] = [
  { valor: 'lead', rotulo: 'Lead' },
  { valor: 'ativo', rotulo: 'Ativo' },
  { valor: 'retorno_pendente', rotulo: 'Retorno pendente' },
  { valor: 'inativo', rotulo: 'Inativo' },
]

export interface Paciente {
  id: string
  clinicId: string
  userId: string | null
  nome: string
  nascimento: string | null // YYYY-MM-DD
  cpf: string | null // dígitos
  telefone: string | null // dígitos
  email: string | null
  origem: OrigemPaciente
  status: StatusPaciente
  responsavelId: string | null
  observacao: string | null
  criadoEm: string // ISO
}

export interface PacienteInput {
  nome: string
  nascimento: string | null
  cpf: string | null
  telefone: string | null
  email: string | null
  origem: OrigemPaciente
  status: StatusPaciente
  responsavelId: string | null
  observacao: string | null
}

export interface Servico {
  id: string
  clinicId: string
  nome: string
  duracaoMin: number
  precoCentavos: number | null
  ativo: boolean
  criadoEm: string
}

export interface ServicoInput {
  nome: string
  duracaoMin: number
  precoCentavos: number | null
  ativo: boolean
}

export type StatusTarefa = 'pendente' | 'concluida' | 'cancelada'

export const STATUS_TAREFA: { valor: StatusTarefa; rotulo: string }[] = [
  { valor: 'pendente', rotulo: 'Pendente' },
  { valor: 'concluida', rotulo: 'Concluída' },
  { valor: 'cancelada', rotulo: 'Cancelada' },
]

export interface Tarefa {
  id: string
  pacienteId: string | null
  responsavelId: string | null // clinic_members.id
  titulo: string
  prazo: string | null // YYYY-MM-DD
  status: StatusTarefa
  criadoEm: string
}

export type TipoInteracao = 'ligacao' | 'whatsapp' | 'email' | 'consulta_presencial' | 'visita' | 'outro'

export const TIPOS_INTERACAO: { valor: TipoInteracao; rotulo: string }[] = [
  { valor: 'ligacao', rotulo: 'Ligação' },
  { valor: 'whatsapp', rotulo: 'WhatsApp' },
  { valor: 'email', rotulo: 'E-mail' },
  { valor: 'consulta_presencial', rotulo: 'Consulta presencial' },
  { valor: 'visita', rotulo: 'Visita' },
  { valor: 'outro', rotulo: 'Outro' },
]

export interface Interacao {
  id: string
  pacienteId: string
  tipo: TipoInteracao
  resumo: string
  criadoEm: string
}

export interface Membro {
  id: string // clinic_members.id
  userId: string
  email: string
  papel: Papel
  status: 'ativo' | 'inativo'
}

export type ItemTimeline = { tipo: 'interacao'; item: Interacao } | { tipo: 'tarefa'; item: Tarefa } | { tipo: 'consulta'; item: Consulta }

export type StatusConsulta = 'agendado' | 'confirmado' | 'atendido' | 'faltou' | 'cancelado'

export const STATUS_CONSULTA: { valor: StatusConsulta; rotulo: string }[] = [
  { valor: 'agendado', rotulo: 'Agendado' },
  { valor: 'confirmado', rotulo: 'Confirmado' },
  { valor: 'atendido', rotulo: 'Atendido' },
  { valor: 'faltou', rotulo: 'Faltou' },
  { valor: 'cancelado', rotulo: 'Cancelado' },
]

export interface Consulta {
  id: string
  pacienteId: string | null
  pacienteNome: string | null
  profissionalId: string | null
  servicoId: string | null
  servicoNome: string | null
  tipo: 'consulta' | 'bloqueio'
  inicio: string // ISO UTC
  fim: string
  status: StatusConsulta
  motivo: string | null
  criadoEm: string
}
