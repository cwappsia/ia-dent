// Telefone: guarda só dígitos; exibição e wa.me centralizados.

export function limparTelefone(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '')
}

/** Vazio é válido (campo opcional); preenchido exige 10–13 dígitos (com ou sem 55). */
export function telefoneValido(valor: string | null | undefined): boolean {
  const t = limparTelefone(valor)
  return t.length === 0 || (t.length >= 10 && t.length <= 13)
}

export function formatarTelefone(valor: string | null | undefined): string {
  const t = limparTelefone(valor)
  if (t.length === 11) return t.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (t.length === 10) return t.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return valor ?? ''
}

/** Link wa.me: assume BR (prefixa 55) quando tem 10–11 dígitos; senão null. */
export function linkWhatsapp(telefone: string | null | undefined): string | null {
  const t = limparTelefone(telefone)
  if (t.length === 10 || t.length === 11) return `https://wa.me/55${t}`
  if (t.length === 12 || t.length === 13) return `https://wa.me/${t}`
  return null
}
