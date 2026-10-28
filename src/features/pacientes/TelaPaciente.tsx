import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTravarScroll } from '../../app/hooks/useTravarScroll'
import { Botao } from '../../components/ui/Botao'
import { Chip } from '../../components/ui/Chip'
import {
  atualizarStatusTarefa,
  buscarPaciente,
  carregarTimeline,
  listarPacientes,
} from '../../services/pacientes'
import { listarMembros } from '../../services/equipe'
import { dataBR, dataHoraBR, idade } from '../../lib/datas'
import { formatarCpf } from '../../lib/cpf'
import { formatarTelefone, linkWhatsapp } from '../../lib/telefone'
import { traduzErro } from '../../lib/sessao'
import { ORIGENS, TIPOS_INTERACAO, STATUS_TAREFA, STATUS_CONSULTA, type ItemTimeline, type Membro, type Paciente } from '../../types'
import { ModalPaciente } from './ModalPaciente'
import { ModalInteracao } from './ModalInteracao'
import { ModalTarefa } from './ModalTarefa'
import { ModalExcluirPaciente } from './ModalExcluirPaciente'

export default function TelaPaciente() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [outros, setOutros] = useState<Paciente[]>([])
  const [timeline, setTimeline] = useState<ItemTimeline[]>([])
  const [membros, setMembros] = useState<Membro[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [modalEditar, setModalEditar] = useState(false)
  const [modalInteracao, setModalInteracao] = useState(false)
  const [modalTarefa, setModalTarefa] = useState(false)
  const [modalExcluir, setModalExcluir] = useState(false)

  useTravarScroll(modalEditar || modalInteracao || modalTarefa || modalExcluir)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const [p, itens, equipe, lista] = await Promise.all([
        buscarPaciente(id),
        carregarTimeline(id),
        listarMembros(),
        listarPacientes(),
      ])
      if (!p) {
        setErro('Paciente não encontrado (ou não é desta clínica).')
        return
      }
      setPaciente(p)
      setTimeline(itens)
      setMembros(equipe.filter((m) => m.status === 'ativo'))
      setOutros(lista)
    } catch {
      setErro('Não consegui carregar o paciente. Tente de novo.')
    } finally {
      setCarregando(false)
    }
  }, [id])

  useEffect(() => {
    void carregar()
  }, [carregar])

  function avisar(msg: string) {
    setAviso(msg)
    void carregar()
    window.setTimeout(() => setAviso(null), 2500)
  }

  async function concluirTarefa(tarefaId: string) {
    try {
      await atualizarStatusTarefa(tarefaId, 'concluida')
      avisar('Tarefa concluída.')
    } catch (e) {
      setErro(traduzErro(e))
    }
  }

  if (carregando) return <p className="text-sm text-suave">Carregando…</p>
  if (erro && !paciente)
    return (
      <div>
        <p role="alert" className="text-sm text-perigo">
          {erro}
        </p>
        <Link className="mt-3 inline-block text-sm text-primaria-forte underline" to="/pacientes">
          Voltar para a lista
        </Link>
      </div>
    )
  if (!paciente) return null

  const whatsapp = linkWhatsapp(paciente.telefone)
  const anos = idade(paciente.nascimento)
  const nomeResponsavel = paciente.responsavelId
    ? outros.find((p) => p.id === paciente.responsavelId)?.nome ?? '—'
    : null

  const info: { rotulo: string; valor: string }[] = [
    { rotulo: 'Telefone', valor: formatarTelefone(paciente.telefone) },
    { rotulo: 'E-mail', valor: paciente.email ?? '—' },
    { rotulo: 'CPF', valor: paciente.cpf ? formatarCpf(paciente.cpf) : '—' },
    {
      rotulo: 'Nascimento',
      valor: paciente.nascimento ? `${dataBR(paciente.nascimento)}${anos !== null ? ` · ${anos} anos` : ''}` : '—',
    },
    { rotulo: 'Origem', valor: ORIGENS.find((o) => o.valor === paciente.origem)?.rotulo ?? paciente.origem },
    { rotulo: 'Cadastrado em', valor: dataHoraBR(paciente.criadoEm) },
  ]

  return (
    <section>
      <Link className="text-sm text-suave underline hover:text-texto" to="/pacientes">
        ← Pacientes
      </Link>

      <div className="mt-4 rounded-xl border border-borda bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-texto">{paciente.nome}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Chip tipo={paciente.status} rotulo={paciente.status} />
              <span className="text-xs text-suave">Status</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Botao onClick={() => setModalInteracao(true)}>Registrar interação</Botao>
            <Botao variante="fantasma" onClick={() => setModalTarefa(true)}>
              Nova tarefa
            </Botao>
            <Botao variante="fantasma" onClick={() => setModalEditar(true)}>
              Editar cadastro
            </Botao>
          </div>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {info.map((linha) => (
            <div key={linha.rotulo}>
              <dt className="text-xs uppercase tracking-wide text-suave">{linha.rotulo}</dt>
              <dd className="mt-0.5 text-sm text-texto">{linha.valor}</dd>
            </div>
          ))}
        </dl>

        {whatsapp && (
          <a
            className="mt-4 inline-flex min-h-[44px] items-center rounded-lg border border-primaria/40 px-4 text-sm text-primaria-forte hover:bg-surface-alta"
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            Chamar no WhatsApp
          </a>
        )}
        {nomeResponsavel && (
          <p className="mt-3 text-sm text-suave">
            Responsável financeiro: <strong className="text-texto">{nomeResponsavel}</strong>
          </p>
        )}
        {paciente.observacao && (
          <p className="mt-3 rounded-lg bg-surface-alta p-3 text-sm text-suave">{paciente.observacao}</p>
        )}
      </div>

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

      <h2 className="mt-8 text-lg font-semibold text-texto">Histórico</h2>
      {timeline.length === 0 ? (
        <p className="mt-3 rounded-xl border border-borda bg-surface p-6 text-sm text-suave">
          Nada registrado ainda. Interações, tarefas e consultas aparecem aqui.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {timeline.map((item) => (
            <li key={item.tipo + item.item.id} className="rounded-xl border border-borda bg-surface p-4">
              {item.tipo === 'interacao' ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-suave">
                    {dataHoraBR(item.item.criadoEm)} ·{' '}
                    {TIPOS_INTERACAO.find((t) => t.valor === item.item.tipo)?.rotulo ?? item.item.tipo}
                  </p>
                  <p className="mt-1 text-sm text-texto">{item.item.resumo}</p>
                </div>
              ) : item.tipo === 'consulta' ? (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-suave">
                      Consulta · {dataHoraBR(item.item.inicio)}
                    </p>
                    <p className="mt-1 text-sm text-texto">
                      {item.item.servicoNome ?? item.item.motivo ?? 'Consulta'}
                    </p>
                    <div className="mt-1.5">
                      <Chip
                        tipo={item.item.status}
                        rotulo={STATUS_CONSULTA.find((s) => s.valor === item.item.status)?.rotulo ?? item.item.status}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-suave">
                      Tarefa · criação {dataHoraBR(item.item.criadoEm)}
                      {item.item.prazo ? ` · prazo ${dataBR(item.item.prazo)}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-texto">{item.item.titulo}</p>
                    <div className="mt-1.5">
                      <Chip
                        tipo={item.item.status}
                        rotulo={STATUS_TAREFA.find((s) => s.valor === item.item.status)?.rotulo ?? item.item.status}
                      />
                    </div>
                  </div>
                  {item.item.status === 'pendente' && (
                    <Botao variante="fantasma" onClick={() => void concluirTarefa(item.item.id)}>
                      Concluir
                    </Botao>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 border-t border-borda pt-4">
        <Botao variante="perigo" onClick={() => setModalExcluir(true)}>
          Excluir paciente
        </Botao>
        <p className="mt-1 text-xs text-suave">Apaga o cadastro e o histórico dele. Não tem volta.</p>
      </div>

      <ModalPaciente
        aberto={modalEditar}
        onFechar={() => setModalEditar(false)}
        onSalvo={(msg) => {
          setModalEditar(false)
          avisar(msg)
        }}
        paciente={paciente}
        outrosPacientes={outros}
      />
      <ModalInteracao
        aberto={modalInteracao}
        onFechar={() => setModalInteracao(false)}
        pacienteId={paciente.id}
        onSalvo={() => {
          setModalInteracao(false)
          avisar('Interação registrada.')
        }}
      />
      <ModalTarefa
        aberto={modalTarefa}
        onFechar={() => setModalTarefa(false)}
        pacienteId={paciente.id}
        membros={membros}
        onSalvo={() => {
          setModalTarefa(false)
          avisar('Tarefa criada.')
        }}
      />
      <ModalExcluirPaciente
        aberto={modalExcluir}
        onFechar={() => setModalExcluir(false)}
        paciente={paciente}
        onExcluido={() => navigate('/pacientes')}
      />
    </section>
  )
}
