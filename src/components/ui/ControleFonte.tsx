import { useFonte } from '../../app/providers/Fonte'

/** Controle de tamanho de fonte compartilhado — aparece no login e dentro do app. */
export function ControleFonte() {
  const { escala, maior, menor, normal } = useFonte()
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Tamanho da fonte">
      <button
        onClick={menor}
        disabled={escala <= 1}
        aria-label="Diminuir tamanho da fonte"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-suave hover:bg-surface-alta hover:text-texto disabled:opacity-40"
      >
        A-
      </button>
      <button
        onClick={normal}
        aria-label="Restaurar tamanho da fonte"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-suave hover:bg-surface-alta hover:text-texto"
      >
        A
      </button>
      <button
        onClick={maior}
        disabled={escala >= 1.5}
        aria-label="Aumentar tamanho da fonte"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-suave hover:bg-surface-alta hover:text-texto disabled:opacity-40"
      >
        A+
      </button>
    </div>
  )
}
