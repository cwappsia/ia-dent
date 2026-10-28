import { paraIsoUtc, somarDiasISO, dataLocalBR, quebrarIso } from './datas'

export interface Expediente {
  dias: number[] // ISO: 1=segunda … 7=domingo
  inicio: string // 'HH:MM'
  fim: string
}

export interface Ocupado {
  i: string // ISO UTC
  f: string
}

export interface Slot {
  hora: string // 'HH:MM' no fuso da clínica
  isoInicio: string
  isoFim: string
}

function somarMinutosHora(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number)
  const total = h * 60 + m + minutos
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/**
 * Slots livres de um dia: expediente em passos da duração, menos os ocupados
 * e menos o que já passou. Dia fora dos dias de funcionamento devolve [].
 */
export function slotsDoDia(
  expediente: Expediente,
  duracaoMin: number,
  dataISO: string,
  fuso: string,
  ocupados: Ocupado[],
  agora = new Date(),
): Slot[] {
  const meioDia = new Date(`${dataISO}T12:00:00Z`)
  const diaSemana = ((meioDia.getUTCDay() + 6) % 7) + 1 // ISO: 1=segunda
  if (!expediente.dias.includes(diaSemana)) return []

  const aberturaMinutos = expediente.inicio.split(':').reduce((a, t) => a * 60 + Number(t), 0)
  const fechamentoMinutos = expediente.fim.split(':').reduce((a, t) => a * 60 + Number(t), 0)
  if (fechamentoMinutos - aberturaMinutos < duracaoMin || duracaoMin <= 0) return []

  const slots: Slot[] = []
  for (let min = aberturaMinutos; min + duracaoMin <= fechamentoMinutos; min += duracaoMin) {
    const hora = `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
    const isoInicio = paraIsoUtc(dataISO, hora, fuso)
    const isoFim = paraIsoUtc(dataISO, somarMinutosHora(hora, duracaoMin), fuso)
    if (new Date(isoInicio) <= agora) continue // já passou
    const cruza = ocupados.some((o) => isoInicio < o.f && isoFim > o.i)
    if (!cruza) slots.push({ hora, isoInicio, isoFim })
  }
  return slots
}

/** Próximos N dias (começando hoje) que a clínica atende. */
export function proximosDias(expediente: Expediente, hojeISO: string, quantidade = 14): string[] {
  const dias: string[] = []
  for (let i = 0; i < quantidade * 2 && dias.length < quantidade; i++) {
    const data = somarDiasISO(hojeISO, i)
    const meioDia = new Date(`${data}T12:00:00Z`)
    const iso = ((meioDia.getUTCDay() + 6) % 7) + 1
    if (expediente.dias.includes(iso)) dias.push(data)
  }
  return dias
}

/** 'sábado, 31 de outubro às 14:00' — resumo do agendamento pro sucesso/WhatsApp. */
export function resumoHorario(isoInicio: string, fuso: string): string {
  const quebrado = quebrarIso(isoInicio, fuso)
  if (!quebrado) return ''
  const { data, hora } = quebrado
  const d = new Date(`${data}T12:00:00Z`)
  const dias = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo']
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  const diaSemana = dias[(d.getUTCDay() + 6) % 7]
  return `${diaSemana}, ${d.getUTCDate()} de ${meses[d.getUTCMonth()]} às ${hora}`
}

export { dataLocalBR }
