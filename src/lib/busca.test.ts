import { describe, expect, it } from 'vitest'
import { formatarTelefone, linkWhatsapp, telefoneValido } from './telefone'
import { pacienteCombina, normalizarBusca } from './busca'

describe('telefone', () => {
  it('aceita vazio (opcional) e 10–13 dígitos; rejeita o resto', () => {
    expect(telefoneValido('')).toBe(true)
    expect(telefoneValido('(15) 99811-7727')).toBe(true)
    expect(telefoneValido('5515998117727')).toBe(true)
    expect(telefoneValido('123')).toBe(false)
  })

  it('formata e monta link wa.me com 55 automático', () => {
    expect(formatarTelefone('15998117727')).toBe('(15) 99811-7727')
    expect(linkWhatsapp('15998117727')).toBe('https://wa.me/5515998117727')
    expect(linkWhatsapp('5515998117727')).toBe('https://wa.me/5515998117727')
    expect(linkWhatsapp('123')).toBeNull()
  })
})

describe('busca normalizada', () => {
  const paciente = { nome: 'Ana Cláudia Souza', email: 'ANA@exemplo.com', cpf: '529.982.247-25', telefone: '(15) 99811-7727' }

  it('ignora acento, caixa e espaços', () => {
    expect(normalizarBusca('  Clínica   Teste ')).toBe('clinica teste')
    expect(pacienteCombina(paciente, 'ana claudia')).toBe(true)
    expect(pacienteCombina(paciente, 'CLÁUDIA')).toBe(true)
    expect(pacienteCombina(paciente, 'ana@exemplo')).toBe(true)
  })

  it('termo com pontuação casa com CPF/telefone pelos dígitos', () => {
    expect(pacienteCombina(paciente, '529.982')).toBe(true)
    expect(pacienteCombina(paciente, '(15) 99811')).toBe(true)
    expect(pacienteCombina(paciente, '99999')).toBe(false)
  })

  it('busca vazia mostra todo mundo', () => {
    expect(pacienteCombina(paciente, '  ')).toBe(true)
  })
})
