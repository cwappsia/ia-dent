import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ControleFonte } from '../components/ui/ControleFonte'
import { Logo } from '../components/ui/Logo'
import { useSessao } from './providers/Sessao'
import { useTema } from './providers/Tema'
import Rodape from './Rodape'

const MENU = [
  { para: '/', rotulo: 'Dashboard', exato: true },
  { para: '/pacientes', rotulo: 'Pacientes', exato: false },
  { para: '/agenda', rotulo: 'Agenda', exato: false },
  { para: '/servicos', rotulo: 'Serviços', exato: false },
  { para: '/configuracoes', rotulo: 'Configurações', exato: false },
]

export default function Layout() {
  const { fase, sair } = useSessao()
  const { tema, alternar } = useTema()
  const [menuAberto, setMenuAberto] = useState(false)
  const navigate = useNavigate()

  const clinica = fase.fase === 'equipe' ? fase.clinica : null

  async function aoSair() {
    await sair()
    navigate('/login')
  }

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Menu principal">
      {MENU.map((item) => (
        <NavLink
          key={item.para}
          to={item.para}
          end={item.exato}
          onClick={() => setMenuAberto(false)}
          className={({ isActive }) =>
            `flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm ${
              isActive
                ? 'bg-surface-alta font-medium text-texto'
                : 'text-suave hover:bg-surface-alta hover:text-texto'
            }`
          }
        >
          {item.rotulo}
        </NavLink>
      ))}
    </nav>
  )

  const rodapeMenu = (
    <div className="mt-auto flex flex-col gap-2 border-t border-borda pt-4">
      <ControleFonte />
      <button
        onClick={alternar}
        className="flex min-h-[44px] items-center rounded-lg px-3 text-sm text-suave hover:bg-surface-alta hover:text-texto"
      >
        {tema === 'escuro' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      </button>
      <button
        onClick={aoSair}
        className="flex min-h-[44px] items-center rounded-lg px-3 text-sm text-perigo hover:bg-surface-alta"
      >
        Sair
      </button>
    </div>
  )

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      {/* Sidebar — desktop */}
      <aside className="hidden flex-col gap-6 border-r border-borda bg-surface p-4 lg:flex">
        <Logo />
        {clinica && (
          <div>
            <p className="text-xs uppercase tracking-wide text-suave">Sua clínica</p>
            <p className="truncate text-sm font-medium text-texto">{clinica.name}</p>
          </div>
        )}
        {nav}
        {rodapeMenu}
      </aside>

      {/* Topbar — mobile */}
      <div className="sticky top-0 z-40 flex min-h-[56px] items-center justify-between border-b border-borda bg-surface px-4 lg:hidden">
        <button
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-suave hover:bg-surface-alta"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <Logo tamanho={28} />
        <span className="w-11" aria-hidden="true" />
      </div>

      {/* Drawer — mobile */}
      {menuAberto && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          onClick={() => setMenuAberto(false)}
        >
          <div
            className="absolute left-0 top-0 flex h-full w-64 flex-col gap-6 border-r border-borda bg-surface p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Logo />
            {clinica && (
              <div>
                <p className="text-xs uppercase tracking-wide text-suave">Sua clínica</p>
                <p className="truncate text-sm font-medium text-texto">{clinica.name}</p>
              </div>
            )}
            {nav}
            {rodapeMenu}
          </div>
        </div>
      )}

      <main className="px-4 py-6 lg:px-8 lg:py-10">
        <Outlet />
        <Rodape />
      </main>
    </div>
  )
}
