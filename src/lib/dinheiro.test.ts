import { describe, expect, it } from 'vitest'
import { centavosDoBanco, centavosParaBanco, formatarCentavos, parseCentavos } from './dinheiro'

describe('parseCentavos', () => {
  it('aceita os formatos pt-BR que o usuário digita', () => {
    expect(parseCentavos('1.234,56')).toBe(123456)
    expect(parseCentavos('1234,56')).toBe(123456)
    expect(parseCentavos('1234.56')).toBe(12345600) // ponto é milhar: 1234 reais
    expect(parseCentavos('123456')).toBe(12345600)
    expect(parseCentavos('0,5')).toBe(50)
    expect(parseCentavos('150')).toBe(15000)
  })

  it('vazio e lixo viram null, nunca NaN', () => {
    expect(parseCentavos('')).toBeNull()
    expect(parseCentavos(null)).toBeNull()
    expect(parseCentavos(undefined)).toBeNull()
    expect(parseCentavos('abc')).toBeNull()
  })
})

describe('formatarCentavos', () => {
  it('formata em pt-BR com agrupamento de milhar', () => {
    expect(formatarCentavos(123456)).toBe('R$ 1.234,56')
    expect(formatarCentavos(15000)).toBe('R$ 150,00')
    expect(formatarCentavos(5)).toBe('R$ 0,05')
    expect(formatarCentavos(0)).toBe('R$ 0,00') // 0 É valor real
  })

  it('null exibe traço (preço opcional)', () => {
    expect(formatarCentavos(null)).toBe('—')
    expect(formatarCentavos(undefined)).toBe('—')
  })
})

describe('ida e volta banco↔centavos sem float', () => {
  it('numeric→centavos→numeric preserva o valor', () => {
    for (const original of [1234.56, 0.05, 150, 99999999.99]) {
      const centavos = centavosDoBanco(original)
      expect(centavosParaBanco(centavos)).toBe(original.toFixed(2))
    }
    expect(centavosDoBanco(null)).toBeNull()
    expect(centavosParaBanco(null)).toBeNull()
  })
})
