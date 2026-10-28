import { useCallback, useEffect, useState } from 'react'
import { useSessao } from '../../app/providers/Sessao'
import { useTravarScroll } from '../../app/hooks/useTravarScroll'
import { Botao } from '../../components/ui/Botao'
import { CampoSelect } from '../../components/ui/Campo'
import { Chip } from '../../components/ui/Chip'
import { listarAgenda } from '../../services/agenda'
import { listarMembros } from '../../services/equipe'
import { listarPacientes } from '../../services/pacientes'
import { listarServicos } from '../../services/servicos'
import {
  dataLocalBR,
  dataPorExtenso,
  diaCurto,
  faixaDia,
  faixaSemana,
  horaBR,
  somarDiasISO,
  inicioDaSemana,
} from '../../lib/datas'
import { STATUS_CONSULTA, type Consulta, type Membro, type Paciente, type Servico } from '../../types'
import { ModalConsulta } from './ModalConsulta'
import { ModalBloqueio } from './ModalBloqueio'

/** undefined = fechado · null = nova consulta · Consulta = edição */
type EstadoModal = Consulta | null | undefined

export default function TelaAgenda() {
  const { fase } = useSessao()
  const clinica = fase.fase === 'equipe' ? fase.clinica : null
  const fuso = clinica?.timezone ?? 'America/Sao_Paulo'

  const [visao, setVisao] = useState<'dia' | 'semana'>('dia')
  const [dataSel, setDataSel] = useState(() => dataLocalBR(new Date().toISOString(), fuso))
  const [profissionalId, setProfissionalId] = useState('')
  const [profissionais, setProfissionais] = useState<Membro[]>([])
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [servicosAtivos, setServicosAtivos] = useState<Servico[]>([])
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [modal, setModal] = useState<EstadoModal>(undefined)
  const [modalBloqueio, setModalBloqueio] = useState(false)

  useTravarScroll(modal !== undefined || modalBloqueio)

  const carregarAgenda = useCallback(async () => {
    if (!profissionalId) return
    setCarregando(true)
    setErro(null)
    try {
      const faixa = visao === 'dia' ? faixaDia(dataSel, fuso) : faixaSemana(dataSel, fuso)
      setConsultas(await listarAgenda(faixa.de, faixa.ate, profissionalId))
    } catch {
      setErro('Não consegui carregar a agenda. Tente de novo.')
    } finally {
      setCarregando(false)
    }
  }, [visao, dataSel, fuso, profissionalId])

  useEffect(() => {
    void carregarAgenda()
  }, [carregarAgenda])

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const [membros, pacs, servs] = await Promise.all([
          listarMembros(),
          listarPacientes(),
          listarServicos(),
        ])
        if (!vivo) return
        const dentistas = membros.filter(
          (m) => m.status === 'ativo' && (m.papel === 'owner' || m.papel === 'dentist'),
        )
        setProfissionais(dentistas)
        setPacientes(pacs)
        setServicosAtivos(servs.filter((s) => s.ativo))
        setProfissionalId((atual) => atual || dentistas[0]?.id || '')
      } catch {
        if (vivo) setErro('Não consegui carregar os dados da agenda.')
      }
    })()
    return () => {
      vivo = false
    }
  }, [])

  function avisar(msg: string) {
    setAviso(msg)
    void carregarAgenda()
    window.setTimeout(() => setAviso(null), 2500)
  }

  function mover(deltaDias: number) {
    setDataSel((d) => somarDiasISO(d, deltaDias))
  }

  const rotuloStatus = (s: string) => STATUS_CONSULTA.find((x) => x.valor === s)?.rotulo ?? s
  const diasSemana = Array.from({ length: 7 }, (_, i) => somarDiasISO(inicioDaSemana(dataSel), i))

  const linha = (c: Consulta) => (
    <button
      key={c.id}
      onClick={() => setModal(c)}
      className="flex w-full items-center gap-4 rounded-xl border border-borda bg-surface p-4 text-left transition hover:bg-surface-alta"
    >
      <span className="w-28 shrink-0 text-sm font-medium text-texto">
        {horaBR(c.inicio, fuso)}–{horaBR(c.fim, fuso)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-texto">
          {c.tipo === 'bloqueio' ? c.motivo ?? 'Bloqueio' : c.pacienteNome ?? 'Paciente removido'}
        </span>
        <span className="block text-xs text-suave">
          {c.tipo === 'bloqueio' ? 'Bloqueio de horário' : (c.servicoNome ?? c.motivo ?? 'Consulta')}
        </span>
      </span>
      <Chip tipo={c.status} rotulo={rotuloStatus(c.status)} />
    </button>
  )

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-texto">Agenda</h1>
        <div className="flex flex-wrap gap-2">
          <Botao onClick={() => setModal(null)}>Nova consulta</Botao>
          <Botao variante="fantasma" onClick={() => setModalBloqueio(true)}>
            Bloquear horário
          </Botao>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-borda">
          <button
            onClick={() => mover(visao === 'dia' ? -1 : -7)}
            aria-label="Período anterior"
            className="flex h-11 w-11 items-center justify-center text-suave hover:bg-surface-alta hover:text-texto"
          >
            ‹
          </button>
          <button
            onClick={() => setDataSel(dataLocalBR(new Date().toISOString(), fuso))}
            className="h-11 px-3 text-sm text-texto hover:bg-surface-alta"
          >
            Hoje
          </button>
          <button
            onClick={() => mover(visao === 'dia' ? 1 : 7)}
            aria-label="Próximo período"
            className="flex h-11 w-11 items-center justify-center text-suave hover:bg-surface-alta hover:text-texto"
          >
            ›
          </button>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-borda" role="group" aria-label="Visão">
          <button
            onClick={() => setVisao('dia')}
            aria-pressed={visao === 'dia'}
            className={`h-11 px-4 text-sm ${visao === 'dia' ? 'bg-surface-alta font-medium text-texto' : 'text-suave hover:bg-surface-alta'}`}
          >
            Dia
          </button>
          <button
            onClick={() => setVisao('semana')}
            aria-pressed={visao === 'semana'}
            className={`h-11 px-4 text-sm ${visao === 'semana' ? 'bg-surface-alta font-medium text-texto' : 'text-suave hover:bg-surface-alta'}`}
          >
            Semana
          </button>
        </div>
        <div className="w-full max-w-64">
          <CampoSelect
            label="Profissional"
            aria-label="Profissional"
            value={profissionalId}
            onChange={(e) => setProfissionalId(e.target.value)}
          >
            {profissionais.map((m) => (
              <option key={m.id} value={m.id}>
                {m.email}
              </option>
            ))}
          </CampoSelect>
        </div>
      </div>

      <p className="mt-3 text-sm text-suave">{dataPorExtenso(dataSel)}</p>

      {aviso && (
        <p role="status" className="mt-3 text-sm text-[var(--ok)]">
          {aviso}
        </p>
      )}
      {erro && (
        <p role="alert" className="mt-3 text-sm text-perigo">
          {erro}
        </p>
      )}

      {carregando ? (
        <p className="mt-6 text-sm text-suave">Carregando…</p>
      ) : consultas.length === 0 && visao === 'dia' ? (
        <p className="mt-6 rounded-xl border border-borda bg-surface p-6 text-sm text-suave">
          Nenhuma consulta neste dia.
        </p>
      ) : visao === 'dia' ? (
        <ul className="mt-4 flex flex-col gap-3">{consultas.map((c) => <li>{linha(c)}</li>)}</ul>
      ) : (
        <div className="mt-4 overflow-x-auto pb-2">
          <div className="grid min-w-[760px] grid-cols-7 gap-2">
            {diasSemana.map((dia) => {
              const doDia = consultas.filter((c) => dataLocalBR(c.inicio, fuso) === dia)
              return (
                <div key={dia} className="min-h-32 rounded-xl border border-borda bg-surface p-2">
                  <p className={`text-center text-xs uppercase ${dia === dataSel ? 'text-primaria-forte' : 'text-suave'}`}>
                    {diaCurto(dia)}
                  </p>
                  {doDia.length === 0 ? (
                    <p className="mt-2 text-center text-xs text-suave">—</p>
                  ) : (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {doDia.map((c) => (
                        <li key={c.id}>
                          <button
                            onClick={() => setModal(c)}
                            className="w-full rounded-lg bg-surface-alta p-2 text-left hover:brightness-110"
                          >
                            <span className="block text-xs font-medium text-texto">
                              {horaBR(c.inicio, fuso)} {c.tipo === 'bloqueio' ? '🔒' : ''}{' '}
                              {c.tipo === 'bloqueio' ? (c.motivo ?? 'Bloqueio') : (c.pacienteNome ?? '—')}
                            </span>
                            <span className="mt-0.5 block">
                              <Chip tipo={c.status} rotulo={rotuloStatus(c.status)} />
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-suave">
        Cancele ou marque falta editando a consulta — nada é apagado, o histórico fica.
      </p>

      <ModalConsulta
        aberto={modal !== undefined}
        onFechar={() => setModal(undefined)}
        onSalvo={(msg) => {
          setModal(undefined)
          avisar(msg)
        }}
        consulta={modal ?? null}
        pacientes={pacientes}
        profissionais={profissionais}
        servicos={servicosAtivos}
        fuso={fuso}
        duracaoPadrao={clinica?.duracao_padrao_consulta ?? 30}
      />
      <ModalBloqueio
        aberto={modalBloqueio}
        onFechar={() => setModalBloqueio(false)}
        onSalvo={() => {
          setModalBloqueio(false)
          avisar('Bloqueio criado.')
        }}
        profissionais={profissionais}
        profissionalInicial={profissionalId}
        fuso={fuso}
      />
    </section>
  )
}
