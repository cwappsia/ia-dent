import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primario' | 'fantasma' | 'perigo'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  carregando?: boolean
}

const classes: Record<Variante, string> = {
  primario: 'bg-[var(--btn-bg)] text-[var(--btn-tx)] hover:brightness-110',
  fantasma: 'bg-transparent text-texto hover:bg-surface-alta',
  perigo: 'bg-transparent text-perigo border border-perigo/40 hover:bg-perigo/10',
}

export function Botao({ variante = 'primario', carregando, disabled, className = '', children, ...props }: Props) {
  return (
    <button
      {...props}
      disabled={disabled || carregando}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${classes[variante]} ${className}`}
    >
      {carregando ? 'Aguarde…' : children}
    </button>
  )
}
