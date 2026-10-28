import type { ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { resolverDestino, rotaDoDestino } from '../lib/sessao'
import Rodape from './Rodape'
import { FonteProvider } from './providers/Fonte'
import { SessaoProvider, useSessao } from './providers/Sessao'
import { TemaProvider } from './providers/Tema'
import Layout from './Layout'
import TelaConvite from '../features/conta/TelaConvite'
import TelaCriarConta from '../features/conta/TelaCriarConta'
import TelaLogin from '../features/conta/TelaLogin'
import TelaOnboarding from '../features/conta/TelaOnboarding'
import TelaDashboard from '../features/dashboard/TelaDashboard'
import TelaMeusAgendamentos from '../features/portal/TelaMeusAgendamentos'
import TelaPacientes from '../features/pacientes/TelaPacientes'
import TelaPaciente from '../features/pacientes/TelaPaciente'
import TelaAgenda from '../features/agenda/TelaAgenda'
import TelaServicos from '../features/servicos/TelaServicos'
import TelaConfiguracoes from '../features/configuracoes/TelaConfiguracoes'
import TelaAgendarPublico from '../features/agendar/TelaAgendarPublico'
import { TelaPrivacidade, TelaTermos } from '../features/publicas/Documento'

function Carga() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Carregando">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-borda border-t-primaria" />
    </div>
  )
}

/** Chrome das telas de conta (login/onboarding/convite): card centralizado + rodapé. */
function LayoutConta({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4">{children}</div>
  )
}

/** Chrome do portal do paciente: coluna estreita + rodapé. */
function LayoutPortal({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4">{children}</div>
}

function GuardaEquipe() {
  const { fase } = useSessao()
  if (fase.fase === 'carregando') return <Carga />
  if (fase.fase === 'sem-usuario') return <Navigate to="/login" replace />
  if (fase.fase === 'sem-clinica') return <Navigate to="/onboarding" replace />
  if (fase.fase === 'paciente') return <Navigate to="/meus-agendamentos" replace />
  return <Layout />
}

function GuardaPaciente() {
  const { fase } = useSessao()
  if (fase.fase === 'carregando') return <Carga />
  if (fase.fase === 'sem-usuario') return <Navigate to="/login" replace />
  if (fase.fase === 'paciente')
    return (
      <LayoutPortal>
        <Outlet />
        <Rodape />
      </LayoutPortal>
    )
  return <Navigate to={rotaDoDestino(resolverDestino(fase))} replace />
}

function GuardaSemClinica() {
  const { fase } = useSessao()
  if (fase.fase === 'carregando') return <Carga />
  if (fase.fase === 'sem-usuario') return <Navigate to="/login" replace />
  if (fase.fase !== 'sem-clinica') return <Navigate to={rotaDoDestino(resolverDestino(fase))} replace />
  return (
    <LayoutConta>
      <Outlet />
      <Rodape />
    </LayoutConta>
  )
}

export default function App() {
  return (
    <TemaProvider>
      <FonteProvider>
        <SessaoProvider>
          <Routes>
            {/* Públicas */}
            <Route path="/login" element={<TelaLogin />} />
            <Route path="/criar-conta" element={<TelaCriarConta />} />
            <Route path="/privacidade" element={<TelaPrivacidade />} />
            <Route path="/termos" element={<TelaTermos />} />
            <Route path="/agendar/:slug" element={<TelaAgendarPublico />} />

            {/* Autenticado sem clínica */}
            <Route element={<GuardaSemClinica />}>
              <Route path="/onboarding" element={<TelaOnboarding />} />
              <Route path="/convite" element={<TelaConvite />} />
            </Route>

            {/* App da equipe */}
            <Route element={<GuardaEquipe />}>
              <Route path="/" element={<TelaDashboard />} />
              <Route path="/pacientes" element={<TelaPacientes />} />
              <Route path="/pacientes/:id" element={<TelaPaciente />} />
              <Route path="/agenda" element={<TelaAgenda />} />
              <Route path="/servicos" element={<TelaServicos />} />
              <Route path="/configuracoes" element={<TelaConfiguracoes />} />
            </Route>

            {/* Portal do paciente */}
            <Route element={<GuardaPaciente />}>
              <Route path="/meus-agendamentos" element={<TelaMeusAgendamentos />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SessaoProvider>
      </FonteProvider>
    </TemaProvider>
  )
}
