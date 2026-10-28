import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const ESCALAS = [1, 1.25, 1.5] as const

interface FonteCtx {
  escala: number
  maior: () => void
  menor: () => void
  normal: () => void
}

const Ctx = createContext<FonteCtx>({ escala: 1, maior: () => {}, menor: () => {}, normal: () => {} })

export function FonteProvider({ children }: { children: ReactNode }) {
  const [escala, setEscala] = useState<number>(() => {
    try {
      const salva = Number(localStorage.getItem('dentia-fonte'))
      return ESCALAS.includes(salva as (typeof ESCALAS)[number]) ? salva : 1
    } catch {
      return 1
    }
  })

  useEffect(() => {
    document.documentElement.style.fontSize = `${escala * 100}%`
  }, [escala])

  function persistir(nova: number) {
    setEscala(nova)
    try {
      localStorage.setItem('dentia-fonte', String(nova))
    } catch {
      /* storage indisponível: escala vive só na sessão */
    }
  }

  function maior() {
    const i = ESCALAS.indexOf(escala as (typeof ESCALAS)[number])
    persistir(ESCALAS[Math.min(i + 1, ESCALAS.length - 1)])
  }

  function menor() {
    const i = ESCALAS.indexOf(escala as (typeof ESCALAS)[number])
    persistir(ESCALAS[Math.max(i - 1, 0)])
  }

  return (
    <Ctx.Provider value={{ escala, maior, menor, normal: () => persistir(1) }}>{children}</Ctx.Provider>
  )
}

export const useFonte = () => useContext(Ctx)
