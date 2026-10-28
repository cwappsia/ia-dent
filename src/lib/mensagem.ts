import type { AgendamentoFeito } from '../services/agendarPublico'
import { resumoHorario } from './slots'
import { limparTelefone, formatarTelefone } from './telefone'

/** Mensagem de confirmação do agendamento — serve pro paciente (dados da consulta)
 *  e pra clínica (dados do paciente) receber prontos no WhatsApp. */
export function msgConfirmacao(
  feito: AgendamentoFeito,
  dados: { nome: string; telefone: string },
  fuso: string,
): string {
  const fone = formatarTelefone(limparTelefone(dados.telefone)) || dados.telefone
  const quem = feito.nome_profissional
    ? `Atendimento com ${feito.nome_profissional}` +
      (feito.registro_profissional ? ` — registro ${feito.registro_profissional}` : '') +
      '.'
    : 'A clínica confirma o horário por telefone.'
  return [
    `Olá! Confirmando o agendamento em ${feito.clinica}.`,
    '',
    `Paciente: ${dados.nome} — ${fone}`,
    `Serviço: ${feito.servico}`,
    `Quando: ${resumoHorario(feito.inicio, fuso)}`,
    '',
    quem,
    '',
    'Para remarcar ou cancelar, responda esta mensagem.',
  ].join('\n')
}
