import { describe, expect, it } from 'vitest'
import { dataBR, dataHoraBR, dataOuNull, faixaDia, faixaSemana, horaBR, idade, inicioDaSemana, paraIsoUtc, quebrarIso, somarDiasISO, dataPorExtenso, diaCurto, dataLocalBR, textoOuNull } from './datas'

describe('dataBR', () => {
  it('formata ISO em DD/MM/AAAA e vazio vira traço', () => {
    expect(dataBR('2026-10-26')).toBe('26/10/2026')
    expect(dataBR(null)).toBe('—')
    expect(dataBR('')).toBe('—')
  })
})

describe('dataHoraBR', () => {
  it('converte UTC pro fuso da clínica (São Paulo = UTC-3)', () => {
    // 26/10/2026 15:00 UTC = 12:00 no fuso de São Paulo
    expect(dataHoraBR('2026-10-26T15:00:00.000Z')).toBe('26/10/2026 12:00')
  })

  it('aceita fuso alternativo e vazio vira traço', () => {
    expect(dataHoraBR('2026-10-26T15:00:00.000Z', 'America/Manaus')).toBe('26/10/2026 11:00')
    expect(dataHoraBR(null)).toBe('—')
  })
})

describe('dataOuNull / textoOuNull', () => {
  it('string vazia de date/text NUNCA vai pro banco', () => {
    expect(dataOuNull('')).toBeNull()
    expect(dataOuNull('   ')).toBeNull()
    expect(dataOuNull('2026-10-26')).toBe('2026-10-26')
    expect(textoOuNull('  obs  ')).toBe('obs')
    expect(textoOuNull('')).toBeNull()
  })
})

describe('idade', () => {
  it('idade completa em anos com referência injetável', () => {
    expect(idade('1990-10-26', '2026-10-26')).toBe(36)
    expect(idade('1990-10-27', '2026-10-26')).toBe(35) // ainda não fez aniversário
    expect(idade('1990-10-25', '2026-10-26')).toBe(36)
    expect(idade(null)).toBeNull()
    expect(idade('2070-01-01', '2026-10-26')).toBeNull() // nascimento no futuro
  })
})

describe('fuso da clínica (local ↔ UTC)', () => {
  it('paraIsoUtc aplica o offset do fuso (SP = UTC-3)', () => {
    expect(paraIsoUtc('2026-10-27', '15:00', 'America/Sao_Paulo')).toBe('2026-10-27T18:00:00.000Z')
    expect(paraIsoUtc('2026-10-27', '00:30', 'America/Sao_Paulo')).toBe('2026-10-27T03:30:00.000Z')
  })

  it('aceita fuso diferente (Manaus = UTC-4)', () => {
    expect(paraIsoUtc('2026-10-27', '15:00', 'America/Manaus')).toBe('2026-10-27T19:00:00.000Z')
  })

  it('quebrarIso devolve data e hora local do fuso (ida e volta)', () => {
    expect(quebrarIso('2026-10-27T18:00:00.000Z', 'America/Sao_Paulo')).toEqual({ data: '2026-10-27', hora: '15:00' })
    // 03:00Z no fuso SP ainda é 26/10 à noite — a data LOCAL muda
    expect(quebrarIso('2026-10-27T03:00:00.000Z', 'America/Sao_Paulo')).toEqual({ data: '2026-10-27', hora: '00:00' })
    expect(quebrarIso('2026-10-26T23:30:00.000Z', 'America/Sao_Paulo')).toEqual({ data: '2026-10-26', hora: '20:30' })
    expect(quebrarIso(null)).toBeNull()
  })

  it('horaBR e dataLocalBR leem no fuso da clínica', () => {
    expect(horaBR('2026-10-27T18:00:00.000Z', 'America/Sao_Paulo')).toBe('15:00')
    expect(dataLocalBR('2026-10-27T03:00:00.000Z', 'America/Sao_Paulo')).toBe('2026-10-27')
  })

  it('faixaDia cobre 00:00–24:00 do fuso local em UTC', () => {
    const { de, ate } = faixaDia('2026-10-27', 'America/Sao_Paulo')
    expect(de).toBe('2026-10-27T03:00:00.000Z')
    expect(ate).toBe('2026-10-28T03:00:00.000Z')
  })

  it('semana começa na segunda e faixaSemana cobre 7 dias', () => {
    // 2026-10-28 é quarta → segunda é 26/10
    expect(inicioDaSemana('2026-10-28')).toBe('2026-10-26')
    expect(inicioDaSemana('2026-10-26')).toBe('2026-10-26')
    expect(inicioDaSemana('2026-11-01')).toBe('2026-10-26') // domingo volta pra segunda anterior
    const { ate } = faixaSemana('2026-10-28', 'America/Sao_Paulo')
    expect(ate).toBe('2026-11-02T03:00:00.000Z')
  })

  it('somarDiasISO e textos de exibição', () => {
    expect(somarDiasISO('2026-10-27', 1)).toBe('2026-10-28')
    expect(somarDiasISO('2026-10-31', 1)).toBe('2026-11-01')
    expect(dataPorExtenso('2026-10-26')).toBe('segunda-feira, 26 de outubro')
    expect(dataPorExtenso('2026-10-31')).toBe('sábado, 31 de outubro')
    expect(diaCurto('2026-10-26')).toBe('seg 26/10')
  })
})
