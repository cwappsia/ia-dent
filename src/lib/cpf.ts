// CPF: validação real de dígitos verificadores; guarda só dígitos.

export function limparCpf(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '')
}

export function cpfValido(valor: string | null | undefined): boolean {
  const c = limparCpf(valor)
  if (c.length !== 11) return false
  if (/^(\d)\1{10}$/.test(c)) return false
  const d = c.split('').map(Number)
  const digito = (fatorInicial: number): number => {
    let soma = 0
    for (let i = 0; i < fatorInicial - 1; i++) soma += d[i] * (fatorInicial - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return digito(10) === d[9] && digito(11) === d[10]
}

export function formatarCpf(valor: string | null | undefined): string {
  const d = limparCpf(valor)
  if (d.length !== 11) return valor ?? ''
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}
