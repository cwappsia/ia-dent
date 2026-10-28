import type { ComponentProps } from 'react'

const CLASSE_INPUT =
  'w-full rounded-lg border bg-surface-alta px-3 py-2.5 text-texto placeholder:text-suave/60 focus:border-primaria focus:outline-none'

interface PropsCampo extends ComponentProps<'input'> {
  label: string
  erro?: string
  hint?: string
}

export function Campo({ label, erro, hint, className = '', ...props }: PropsCampo) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-suave">{label}</span>
      <input
        {...props}
        aria-invalid={erro ? true : undefined}
        aria-describedby={hint ? `${props.id ?? 'campo'}-hint` : undefined}
        className={`${CLASSE_INPUT} ${erro ? 'border-perigo' : 'border-borda'} ${className}`}
      />
      {hint && !erro && (
        <span id={`${props.id ?? 'campo'}-hint`} className="mt-1 block text-xs text-suave">
          {hint}
        </span>
      )}
      {erro && (
        <span role="alert" className="mt-1 block text-xs text-perigo">
          {erro}
        </span>
      )}
    </label>
  )
}

interface PropsSelect extends ComponentProps<'select'> {
  label: string
  erro?: string
}

export function CampoSelect({ label, erro, className = '', children, ...props }: PropsSelect) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-suave">{label}</span>
      <select
        {...props}
        aria-invalid={erro ? true : undefined}
        className={`${CLASSE_INPUT} ${erro ? 'border-perigo' : 'border-borda'} ${className}`}
      >
        {children}
      </select>
      {erro && (
        <span role="alert" className="mt-1 block text-xs text-perigo">
          {erro}
        </span>
      )}
    </label>
  )
}

interface PropsTexto extends ComponentProps<'textarea'> {
  label: string
  erro?: string
}

export function CampoTexto({ label, erro, className = '', ...props }: PropsTexto) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-suave">{label}</span>
      <textarea
        {...props}
        aria-invalid={erro ? true : undefined}
        className={`${CLASSE_INPUT} min-h-[88px] resize-y ${erro ? 'border-perigo' : 'border-borda'} ${className}`}
      />
      {erro && (
        <span role="alert" className="mt-1 block text-xs text-perigo">
          {erro}
        </span>
      )}
    </label>
  )
}
