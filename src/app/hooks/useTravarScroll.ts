import { useEffect } from 'react'

/**
 * Trava o scroll do body enquanto um modal está aberto.
 * QUEM ABRE o modal chama este hook — o modal nunca chama (duas chamadas brigam e o scroll morre).
 */
export function useTravarScroll(ativo: boolean) {
  useEffect(() => {
    if (!ativo) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [ativo])
}
