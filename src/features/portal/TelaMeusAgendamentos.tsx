import { useEffect, useState } from 'react'
import { useSessao } from '../../app/providers/Sessao'
import { Botao } from '../../components/ui/Botao'
import { Chip } from '../../components/ui/Chip'
import { resumoHorario } from '../../lib/slots'
import { STATUS_CONSULTA, type StatusConsulta } from '../../types'
import { minhasConsultas, type ConsultaPortal } from '../../services/portal'

function rotuloStatus(s: StatusConsulta): string {
  return STATUS_CONSULTA.find((x) => x.valor === s)?.rotulo ?? s
}

export default function TelaMeusAgendamentos() {
  const { fase, sair } = useSessao()
  const [consultas, setConsultas] = useState<ConsultaPortal[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const lista = await minhasConsultas()
        if (vivo) setConsultas(lista)
      } catch {
        if (vivo) setErro('Não consegui carregar suas consultas. Tente de novo.')
      } finally {
        if (vivo) setCarregando(false)
      }
    })()
    return () => {
      vivo = false
    }
  }, [])

  const agora = Date.now()
  const proximas = consultas.filter((c) => new Date(c.fim).getTime() >= agora)
  const anteriores = consultas.filter((c) => new Date(c.fim).getTime() < agora)

  function linha(c: ConsultaPortal) {
    return (
      <li key={c.id} className="rounded-xl border border-borda bg-surface p-4">
        <p className="text-xs uppercase tracking-wide text-suave">{c.clinica}</p>
        <p className="mt-1 text-sm font-medium text-texto">{c.servico ?? 'Consulta'}</p>
        <p className="mt-0.5 text-sm text-suave">{resumoHorario(c.inicio, c.fuso)}</p>
        <div className="mt-2">
          <Chip tipo={c.status} rotulo={rotuloStatus(c.status)} />
        </div>
      </li>
    )
  }

  return (
    <section className="py-10">
      <h1 className="text-xl font-semibold text-texto">Meus agendamentos</h1>
      <p className="mt-1 text-sm text-suave">
        {fase.fase === 'paciente' ? 'Suas consultas, só suas.' : 'Área do paciente.'}
      </p>

      {erro && (
        <p role="alert" className="mt-4 text-sm text-perigo">
          {erro}
        </p>
      )}

      {carregando ? (
        <p className="mt-6 text-sm text-suave">Carregando…</p>
      ) : (
        <>
          <h2 className="mt-6 text-sm font-medium text-suave">Próximas</h2>
          {proximas.length === 0 ? (
            <p className="mt-2 rounded-xl border border-borda bg-surface p-5 text-sm text-suave">
              Nenhuma consulta marcada.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-3">{proximas.map(linha)}</ul>
          )}

          {anteriores.length > 0 && (
            <>
              <h2 className="mt-8 text-sm font-medium text-suave">Anteriores</h2>
              <ul className="mt-2 flex flex-col gap-3 opacity-75">{anteriores.map(linha)}</ul>
            </>
          )}

          {consultas.length > 0 && consultas[0].slug && (
            <Botao
              variante="fantasma"
              onClick={() => (window.location.href = `/agendar/${consultas[0].slug}`)}
            >
              Marcar nova consulta
            </Botao>
          )}
        </>
      )}

      <button
        onClick={() => void sair()}
        className="mt-6 text-sm text-suave underline hover:text-texto"
      >
        Sair da conta
      </button>
    </section>
  )
}
