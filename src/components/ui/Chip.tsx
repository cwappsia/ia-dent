/** Rótulo com ponto de cor — a informação é o TEXTO, a cor é reforço (nunca só cor). */
const CORES: Record<string, string> = {
  lead: 'var(--lead)',
  ativo: 'var(--ok)',
  retorno_pendente: 'var(--info)',
  inativo: 'var(--neutro)',
  pendente: 'var(--lead)',
  concluida: 'var(--ok)',
  cancelada: 'var(--neutro)',
  servico_ativo: 'var(--ok)',
  servico_inativo: 'var(--neutro)',
  agendado: 'var(--lead)',
  confirmado: 'var(--info)',
  atendido: 'var(--ok)',
  faltou: 'var(--perigo)',
  cancelado: 'var(--neutro)',
}

export function Chip({ tipo, rotulo }: { tipo: string; rotulo: string }) {
  const cor = CORES[tipo] ?? 'var(--tx-suave)'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: cor }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cor }} aria-hidden="true" />
      {rotulo}
    </span>
  )
}
