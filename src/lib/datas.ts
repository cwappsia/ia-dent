// Datas: helpers puros pt-BR (fuso da clínica no único lugar que converte).
// date vazio → null SEMPRE por aqui; nunca toLocale* espalhado pelas telas.

export function dataBR(iso?: string | null): string {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  if (!ano || !mes || !dia) return '—'
  return `${dia}/${mes}/${ano}`
}

/** timestamptz UTC → "26/10/2026 14:30" no fuso da clínica. */
export function dataHoraBR(isoUtc?: string | null, fuso = 'America/Sao_Paulo'): string {
  if (!isoUtc) return '—'
  try {
    const bruto = new Intl.DateTimeFormat('pt-BR', {
      timeZone: fuso,
      dateStyle: 'short',
      timeStyle: 'short',
      hour12: false,
    }).format(new Date(isoUtc))
    return bruto.replace(', ', ' ')
  } catch {
    return '—'
  }
}

/** Campo date vazio (string vazia) → null; nunca manda '' pro banco. */
export function dataOuNull(valor: string | null | undefined): string | null {
  const t = (valor ?? '').trim()
  return t ? t : null
}

export function textoOuNull(valor: string | null | undefined): string | null {
  const t = (valor ?? '').trim()
  return t ? t : null
}

/** Idade completa em anos — cálculo puro com data de referência injetável. */
export function idade(nascimentoIso?: string | null, hojeIso?: string): number | null {
  if (!nascimentoIso) return null
  const hoje = hojeIso ?? new Date().toISOString().slice(0, 10)
  const [na, nm, nd] = nascimentoIso.slice(0, 10).split('-').map(Number)
  const [ha, hm, hd] = hoje.split('-').map(Number)
  if (!na || !ha) return null
  let anos = ha - na
  if (hm < nm || (hm === nm && hd < nd)) anos -= 1
  return anos < 0 ? null : anos
}

// ---- Fuso da clínica: o ÚNICO lugar que converte local ↔ UTC ----

/** Offset do fuso (ms) num instante — two-pass (lida com horário de verão). */
function offsetFusoMs(fuso: string, instante: Date): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: fuso,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instante)
  const p: Record<string, string> = {}
  for (const x of partes) p[x.type] = x.value
  const hora = p.hour === '24' ? '00' : p.hour
  const comoUtc = Date.parse(`${p.year}-${p.month}-${p.day}T${hora}:${p.minute}:${p.second}Z`)
  return comoUtc - instante.getTime()
}

/** "2026-10-27" + "14:30" no fuso da clínica → ISO UTC pro banco. */
export function paraIsoUtc(dataISO: string, hora: string, fuso = 'America/Sao_Paulo'): string {
  const chute = new Date(`${dataISO}T${hora}:00Z`) // trata como se fosse UTC
  const offset = offsetFusoMs(fuso, chute)
  return new Date(chute.getTime() - offset).toISOString()
}

/** ISO UTC → { data, hora } no fuso da clínica (pra pré-preencher forms). */
export function quebrarIso(
  isoUtc?: string | null,
  fuso = 'America/Sao_Paulo',
): { data: string; hora: string } | null {
  if (!isoUtc) return null
  try {
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: fuso,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(new Date(isoUtc))
    const p: Record<string, string> = {}
    for (const x of partes) p[x.type] = x.value
    if (!p.year || !p.month || !p.day) return null
    const hora = p.hour === '24' ? '00' : p.hour
    return { data: `${p.year}-${p.month}-${p.day}`, hora: `${hora}:${p.minute}` }
  } catch {
    return null
  }
}

/** HH:MM no fuso da clínica. */
export function horaBR(isoUtc?: string | null, fuso = 'America/Sao_Paulo'): string {
  const quebrado = quebrarIso(isoUtc, fuso)
  return quebrado ? quebrado.hora : '—'
}

export function somarDiasISO(dataISO: string, dias: number): string {
  const d = new Date(`${dataISO}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Segunda-feira da semana da data (semana começa na segunda). */
export function inicioDaSemana(dataISO: string): string {
  const d = new Date(`${dataISO}T12:00:00Z`)
  const diaSemana = (d.getUTCDay() + 6) % 7
  return somarDiasISO(dataISO, -diaSemana)
}

/** Faixa [início, fim) do dia/semana no fuso da clínica, em ISO UTC. */
export function faixaDia(dataISO: string, fuso: string): { de: string; ate: string } {
  return {
    de: paraIsoUtc(dataISO, '00:00', fuso),
    ate: paraIsoUtc(somarDiasISO(dataISO, 1), '00:00', fuso),
  }
}

export function faixaSemana(dataISO: string, fuso: string): { de: string; ate: string } {
  const segunda = inicioDaSemana(dataISO)
  return {
    de: paraIsoUtc(segunda, '00:00', fuso),
    ate: paraIsoUtc(somarDiasISO(segunda, 7), '00:00', fuso),
  }
}

const DIAS_SEMANA = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

function numerosDaData(dataISO: string): { dia: number; mes: number; ano: number; diaSemana: number } {
  const d = new Date(`${dataISO}T12:00:00Z`)
  return { dia: d.getUTCDate(), mes: d.getUTCMonth() + 1, ano: d.getUTCFullYear(), diaSemana: (d.getUTCDay() + 6) % 7 }
}

/** "segunda-feira, 26 de outubro" */
export function dataPorExtenso(dataISO: string): string {
  const { dia, mes, diaSemana } = numerosDaData(dataISO)
  const extenso = DIAS_SEMANA[diaSemana] + '-feira'
  return `${DIAS_SEMANA[diaSemana] === 'sábado' || DIAS_SEMANA[diaSemana] === 'domingo' ? DIAS_SEMANA[diaSemana] : extenso}, ${dia} de ${MESES[mes - 1]}`
}

/** "Seg 26/10" — cabeçalho de coluna da semana. */
export function diaCurto(dataISO: string): string {
  const { dia, mes, diaSemana } = numerosDaData(dataISO)
  return `${DIAS_SEMANA[diaSemana].slice(0, 3)} ${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}`
}

/** Data local (YYYY-MM-DD) de um ISO UTC no fuso da clínica. */
export function dataLocalBR(isoUtc?: string | null, fuso = 'America/Sao_Paulo'): string {
  return quebrarIso(isoUtc, fuso)?.data ?? ''
}
