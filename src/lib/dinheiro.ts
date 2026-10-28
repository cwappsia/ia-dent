// Dinheiro: inteiro em centavos no TS; numeric no banco; pt-BR só na exibição.
// Zero float em cálculo — parse por texto, escrita por string decimal exata.

/** Aceita "1.234,56", "1234,56", "1234.56" (ponto = milhar) e "123456"; '' → null. */
export function parseCentavos(entrada: string | null | undefined): number | null {
  const bruto = (entrada ?? '').toString().trim()
  if (!bruto) return null
  const limpo = bruto.replace(/[^\d.,-]/g, '')
  if (!/\d/.test(limpo)) return null
  let digitos: string
  if (limpo.includes(',')) {
    // vírgula é o decimal: pontos são milhar
    const [inteiro, ...resto] = limpo.split(',')
    const decimal = (resto.join('') || '0').replace(/\./g, '').slice(0, 2)
    digitos = inteiro.replace(/\./g, '') + decimal.padEnd(2, '0')
  } else {
    // sem vírgula: pontos são milhar, valor inteiro em reais
    digitos = limpo.replace(/\./g, '') + '00'
  }
  const valor = parseInt(digitos, 10)
  return Number.isFinite(valor) ? valor : null
}

/** 123456 → "R$ 1.234,56" */
export function formatarCentavos(centavos: number | null | undefined): string {
  if (centavos === null || centavos === undefined) return '—'
  const negativo = centavos < 0
  const abs = Math.abs(Math.round(centavos))
  const reais = Math.floor(abs / 100).toString()
  const cent = (abs % 100).toString().padStart(2, '0')
  const agrupado = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${negativo ? '-' : ''}R$ ${agrupado},${cent}`
}

/** numeric do PostgREST (number) → centavos, com um único round na fronteira. */
export function centavosDoBanco(valor: number | null | undefined): number | null {
  if (valor === null || valor === undefined) return null
  return Math.round(valor * 100)
}

/** centavos → string decimal exata pro numeric (nunca float no JSON). */
export function centavosParaBanco(centavos: number | null | undefined): string | null {
  if (centavos === null || centavos === undefined) return null
  const abs = Math.abs(Math.round(centavos))
  const reais = Math.floor(abs / 100)
  const cent = (abs % 100).toString().padStart(2, '0')
  return `${centavos < 0 ? '-' : ''}${reais}.${cent}`
}
