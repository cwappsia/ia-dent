import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Tema = 'claro' | 'escuro'

interface TemaCtx {
  tema: Tema
  alternar: () => void
}

const Ctx = createContext<TemaCtx>({ tema: 'escuro', alternar: () => {} })

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(() =>
    typeof document !== 'undefined' && document.documentElement.dataset.tema === 'claro'
      ? 'claro'
      : 'escuro',
  )

  useEffect(() => {
    document.documentElement.dataset.tema = tema
    try {
      localStorage.setItem('dentia-tema', tema)
    } catch {
      /* storage indisponível: tema vive só na sessão */
    }
  }, [tema])

  return (
    <Ctx.Provider value={{ tema, alternar: () => setTema((t) => (t === 'escuro' ? 'claro' : 'escuro')) }}>
      {children}
    </Ctx.Provider>
  )
}

export const useTema = () => useContext(Ctx)
