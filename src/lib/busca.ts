// Busca normalizada: acento, caixa e pontuação nunca escondem um resultado.

export function normalizarBusca(valor: string | null | undefined): string {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function digitos(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '')
}

/** Termo casa com nome/e-mail (texto normalizado) OU CPF/telefone (só dígitos). */
export function pacienteCombina(
  paciente: { nome: string; email?: string | null; cpf?: string | null; telefone?: string | null },
  termo: string,
): boolean {
  const t = normalizarBusca(termo)
  if (!t) return true
  const alvo = `${normalizarBusca(paciente.nome)} ${normalizarBusca(paciente.email ?? '')}`
  if (alvo.includes(t)) return true
  const td = digitos(termo)
  if (td && (digitos(paciente.cpf).includes(td) || digitos(paciente.telefone).includes(td))) {
    return true
  }
  return false
}
