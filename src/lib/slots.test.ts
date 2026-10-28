import { describe, expect, it } from 'vitest'
import { proximosDias, resumoHorario, slotsDoDia, type Expediente } from './slots'

const SEG_SEX: Expediente = { dias: [1, 2, 3, 4, 5], inicio: '08:00', fim: '18:00' }
const FUSO = 'America/Sao_Paulo'

describe('slotsDoDia', () => {
  const agora = new Date('2026-10-26T00:00:00.000Z') // domingo meia-noite UTC — nada passou ainda em 26/10

  it('gera slots de 30 min de 08:00 a 18:00 (20 slots) quando o dia é livre', () => {
    const slots = slotsDoDia(SEG_SEX, 30, '2026-10-26', FUSO, [], agora) // 26/10 é segunda
    expect(slots.length).toBe(20)
    expect(slots[0].hora).toBe('08:00')
    expect(slots[19].hora).toBe('17:30')
    expect(slots[0].isoInicio).toBe('2026-10-26T11:00:00.000Z') // 08:00 SP = 11:00Z
  })

  it('remove slots que cruzam com ocupados', () => {
    const ocupados = [{ i: '2026-10-26T12:00:00.000Z', f: '2026-10-26T12:30:00.000Z' }] // 09:00–09:30 SP
    const slots = slotsDoDia(SEG_SEX, 30, '2026-10-26', FUSO, ocupados, agora)
    expect(slots.find((s) => s.hora === '09:00')).toBeUndefined()
    expect(slots.find((s) => s.hora === '08:30')).toBeDefined() // 08:30-09:00 não cruza (range [) )
    expect(slots.length).toBe(19)
  })

  it('dia fora do expediente (sábado) devolve vazio', () => {
    expect(slotsDoDia(SEG_SEX, 30, '2026-10-31', FUSO, [], agora)).toEqual([])
  })

  it('remove horários que já passaram hoje', () => {
    const tarde = new Date('2026-10-26T15:00:00.000Z') // 12:00 SP de segunda
    const slots = slotsDoDia(SEG_SEX, 60, '2026-10-26', FUSO, [], tarde)
    expect(slots[0].hora).toBe('13:00') // 12:00 SP já era; próximo slot inteiro é 13:00
    expect(slots.length).toBe(5)
  })

  it('serviço que não cabe no fim do expediente encurta a lista', () => {
    const slots = slotsDoDia(SEG_SEX, 120, '2026-10-26', FUSO, [], agora)
    expect(slots[slots.length - 1].hora).toBe('16:00') // 16:00+120 = 18:00 fecha certo
    expect(slots.length).toBe(5)
  })
})

describe('proximosDias', () => {
  it('só devolve dias atendidos a partir de hoje', () => {
    // 2026-10-26 é segunda; 31/10 é sábado
    const dias = proximosDias(SEG_SEX, '2026-10-26', 5)
    expect(dias[0]).toBe('2026-10-26')
    expect(dias).toContain('2026-10-30') // sexta
    expect(dias).not.toContain('2026-10-31') // sábado fora
    expect(dias.length).toBe(5)
  })
})

describe('resumoHorario', () => {
  it('data e hora no fuso da clínica', () => {
    expect(resumoHorario('2026-10-26T14:00:00.000Z', FUSO)).toBe('segunda-feira, 26 de outubro às 11:00')
  })
})
