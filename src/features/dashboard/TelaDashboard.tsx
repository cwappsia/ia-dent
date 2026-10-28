import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSessao } from '../../app/providers/Sessao'
import { Botao } from '../../components/ui/Botao'
import { Chip } from '../../components/ui/Chip'
import { dataBR, dataLocalBR, faixaDia, horaBR } from '../../lib/datas'
import { listarAgendaDaClinica } from '../../services/agenda'
import { listarLeadsRecentes, tarefasPendentes, type LeadResumo, type TarefaPendente } from '../../services/pacientes'
import { STATUS_CONSULTA, type Consulta } from '../../types'

export default function TelaDashboard() {
  const { fase } = useSessao()
  const clinica = fase.fase === 'equipe' ? fase.clinica : null
  const fuso = clinica?.timezone ?? 'America/Sao_Paulo'
  const hoje = dataLocalBR(new Date().toISOString(), fuso)

  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [leads, setLeads] = useState<LeadResumo[]>([])
  const [tarefas, setTarefas] = useState<TarefaPendente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const faixa = faixaDia(hoje, fuso)
        const [hojeAgenda, novosLeads, pendentes] = await Promise.all([
          listarAgendaDaClinica(faixa.de, faixa.ate),
          listarLeadsRecentes(),
          tarefasPendentes(),
        ])
        if (!vivo) return
        setConsultas(hojeAgenda)
        setLeads(novosLeads)
        setTarefas(pendentes)
      } catch {
        /* dashboard é leitura: estado vazio já comunica */
      } finally {
        if (vivo) setCarregando(false)
      }
    })()
    return () => {
      vivo = false
    }
  }, [hoje, fuso])

  function copiarLink() {
    if (!clinica) return
    void navigator.clipboard
      .writeText(`${window.location.origin}/agendar/${clinica.slug}`)
      .then(() => {
        setAviso('Link copiado.')
        window.setTimeout(() => setAviso(null), 2500)
      })
  }

  const rotuloStatus = (s: string) => STATUS_CONSULTA.find((x) => x.valor === s)?.rotulo ?? s

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-texto">Dashboard</h1>
          <p className="mt-1 text-sm text-suave">{clinica?.name}</p>
        </div>
        {clinica && (
          <div className="text-right">
            <Botao variante="fantasma" onClick={copiarLink}>
              Copiar link de agendamento
            </Botao>
            <p className="mt-1 text-xs text-suave">
              <code className="rounded bg-surface-alta px-1.5 py-0.5">/agendar/{clinica.slug}</code>
            </p>
          </div>
        )}
      </div>

      {aviso && (
        <p role="status" className="mt-3 text-sm text-[var(--ok)]">
          {aviso}
        </p>
      )}

      {carregando ? (
        <p className="mt-6 text-sm text-suave">Carregando…</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-borda bg-surface p-5">
            <h2 className="text-sm font-medium text-suave">Consultas de hoje</h2>
            {consultas.length === 0 ? (
              <p className="mt-3 text-sm text-suave">Nenhuma consulta hoje.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {consultas.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-texto">
                        {horaBR(c.inicio, fuso)}{' '}
                        {c.tipo === 'bloqueio'
                          ? `🔒 ${c.motivo ?? 'Bloqueio'}`
                          : (c.pacienteNome ?? 'Paciente removido')}
                      </p>
                      <p className="truncate text-xs text-suave">
                        {c.tipo === 'bloqueio' ? 'Bloqueio' : (c.servicoNome ?? c.motivo ?? 'Consulta')}
                      </p>
                    </div>
                    <Chip tipo={c.status} rotulo={rotuloStatus(c.status)} />
                  </li>
                ))}
              </ul>
            )}
            <Link to="/agenda" className="mt-4 inline-block text-sm text-primaria-forte underline">
              Ver agenda
            </Link>
          </div>

          <div className="rounded-xl border border-borda bg-surface p-5">
            <h2 className="text-sm font-medium text-suave">
              Leads da semana{leads.length > 0 ? ` (${leads.length})` : ''}
            </h2>
            {leads.length === 0 ? (
              <p className="mt-3 text-sm text-suave">
                Nenhum lead novo nos últimos 7 dias. Compartilhe o link de agendamento.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {leads.map((l) => (
                  <li key={l.id} className="flex items-baseline justify-between gap-2">
                    <Link
                      to={`/pacientes/${l.id}`}
                      className="truncate text-sm text-texto underline-offset-2 hover:underline"
                    >
                      {l.nome}
                    </Link>
                    <span className="shrink-0 text-xs text-suave">
                      {dataBR(dataLocalBR(l.criadoEm, fuso))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/pacientes" className="mt-4 inline-block text-sm text-primaria-forte underline">
              Ver pacientes
            </Link>
          </div>

          <div className="rounded-xl border border-borda bg-surface p-5">
            <h2 className="text-sm font-medium text-suave">
              Pendências{tarefas.length > 0 ? ` (${tarefas.length})` : ''}
            </h2>
            {tarefas.length === 0 ? (
              <p className="mt-3 text-sm text-suave">Nada pendente. Tudo em ordem.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {tarefas.map((t) => {
                  const atrasada = !!t.prazo && t.prazo < hoje
                  return (
                    <li key={t.id}>
                      <p className={`text-sm ${atrasada ? 'text-perigo' : 'text-texto'}`}>
                        {t.titulo}
                        {t.pacienteNome ? <span className="text-suave"> · {t.pacienteNome}</span> : null}
                      </p>
                      <p className="text-xs text-suave">
                        {t.prazo ? `${atrasada ? 'Atrasada — ' : ''}prazo ${dataBR(t.prazo)}` : 'Sem prazo'}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
            <Link to="/pacientes" className="mt-4 inline-block text-sm text-primaria-forte underline">
              Ver pacientes
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
