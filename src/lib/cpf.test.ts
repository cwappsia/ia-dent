import { describe, expect, it } from 'vitest'
import { cpfValido, formatarCpf, limparCpf } from './cpf'

describe('cpfValido', () => {
  it('aceita CPF real com dígitos verificadores certos', () => {
    // 529.982.247-25 é o CPF de exemplo clássico válido
    expect(cpfValido('529.982.247-25')).toBe(true)
    expect(cpfValido('52998224725')).toBe(true)
  })

  it('rejeita inválidos sem exceção', () => {
    expect(cpfValido('529.982.247-26')).toBe(false) // dígito errado
    expect(cpfValido('111.111.111-11')).toBe(false) // repetido
    expect(cpfValido('123')).toBe(false)
    expect(cpfValido('')).toBe(false)
    expect(cpfValido(null)).toBe(false)
  })
})

describe('limparCpf / formatarCpf', () => {
  it('limpa pontuação e formata só quando tem 11 dígitos', () => {
    expect(limparCpf('529.982.247-25')).toBe('52998224725')
    expect(formatarCpf('52998224725')).toBe('529.982.247-25')
    expect(formatarCpf('123')).toBe('123')
  })
})
