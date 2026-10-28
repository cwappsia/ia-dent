import { describe, expect, it } from 'vitest'
import { msgConfirmacao } from './mensagem'
import type { AgendamentoFeito } from '../services/agendarPublico'

const feito = (extra: Partial<AgendamentoFeito> = {}): AgendamentoFeito => ({
  clinica: 'Clínica QA Dentia',
  servico: 'Limpeza',
  inicio: '2026-11-02T08:00:00-03:00',
  fim: '2026-11-02T08:30:00-03:00',
  whatsapp: '5515999998888',
  nome_profissional: null,
  registro_profissional: null,
  ...extra,
})

describe('msgConfirmacao', () => {
  it('inclui nome da doutora e registro quando a clínica cadastrou', () => {
    const msg = msgConfirmacao(
      feito({ nome_profissional: 'Dra. Marina Souza', registro_profissional: 'CRO-SP 12.345' }),
      { nome: 'João da Silva', telefone: '(15) 97777-6666' },
      'America/Sao_Paulo',
    )
    expect(msg).toContain('Atendimento com Dra. Marina Souza — registro CRO-SP 12.345.')
    expect(msg).toContain('Paciente: João da Silva — (15) 97777-6666')
    expect(msg).toContain('Serviço: Limpeza')
    expect(msg).toContain('Clínica QA Dentia')
  })

  it('sem profissional, texto neutro e sem linha de registro', () => {
    const msg = msgConfirmacao(feito(), { nome: 'Ana', telefone: '15977776666' }, 'America/Sao_Paulo')
    expect(msg).toContain('A clínica confirma o horário por telefone.')
    expect(msg).not.toContain('registro')
  })

  it('nome sem registro cai no nome limpo', () => {
    const msg = msgConfirmacao(
      feito({ nome_profissional: 'Dra. Marina' }),
      { nome: 'Ana', telefone: '15977776666' },
      'America/Sao_Paulo',
    )
    expect(msg).toContain('Atendimento com Dra. Marina.')
  })
})
