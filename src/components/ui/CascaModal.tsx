import { useEffect, type ReactNode } from 'react'

interface Props {
  aberto: boolean
  onFechar: () => void
  titulo: string
  children: ReactNode
  rodape?: ReactNode
}

/**
 * Casca de modal compartilhada — cabe, centraliza; não cabe, scrolla com topo acessível.
 * X e ESC fecham. Quem ABRE o modal cuida da trava de scroll (o modal nunca chama).
 */
export function CascaModal({ aberto, onFechar, titulo, children, rodape }: Props) {
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-black/50"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="w-full max-w-lg rounded-xl border border-borda bg-surface p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{titulo}</h2>
            <button
              onClick={onFechar}
              aria-label="Fechar"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-suave hover:bg-surface-alta hover:text-texto"
            >
              ✕
            </button>
          </div>
          {children}
          {rodape && <div className="mt-5">{rodape}</div>}
        </div>
      </div>
    </div>
  )
}
