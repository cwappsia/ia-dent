import { z } from 'zod'
import { cpfValido } from '../../lib/cpf'
import { telefoneValido } from '../../lib/telefone'

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const ORIGENS_CAMPO = [
  { value: 'manual', label: 'Cadastro manual' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'agendamento_online', label: 'Agendamento online' },
  { value: 'outro', label: 'Outro' },
] as const

export const STATUS_CAMPO = [
  { value: 'lead', label: 'Lead' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'retorno_pendente', label: 'Retorno pendente' },
  { value: 'inativo', label: 'Inativo' },
] as const

export const esquemaPaciente = z.object({
  nome: z.string().trim().min(2, 'Informe o nome (mín. 2 letras).'),
  nascimento: z.string().optional(),
  cpf: z
    .string()
    .optional()
    .refine((v) => !v?.trim() || cpfValido(v), 'CPF inválido — confira os números.'),
  telefone: z
    .string()
    .optional()
    .refine((v) => !v?.trim() || telefoneValido(v), 'Telefone inválido — use DDD + número.'),
  email: z
    .string()
    .optional()
    .refine((v) => !v?.trim() || REGEX_EMAIL.test(v), 'E-mail inválido.'),
  origem: z.enum(['manual', 'indicacao', 'instagram', 'facebook', 'google', 'agendamento_online', 'outro']),
  status: z.enum(['lead', 'ativo', 'retorno_pendente', 'inativo']),
  responsavelId: z.string().optional(),
  observacao: z.string().optional(),
})

export type FormPaciente = z.infer<typeof esquemaPaciente>
