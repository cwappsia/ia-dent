import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTravarScroll } from '../../app/hooks/useTravarScroll'
import { Botao } from '../../components/ui/Botao'
import { Chip } from '../../components/ui/Chip'
import { formatarCentavos } from '../../lib/dinheiro'
import { listarServicos } from '../../services/servicos'
import type { Servico } from '../../types'
import { ModalServico } from './ModalServico'

export default function TelaServicos() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Servico | null>(null)

  useTravarScroll(modalAberto)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      setServicos(await listarServicos())
    } catch {
      setErro('Não consegui carregar os serviços. Tente de novo.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  // ativos primeiro, ordem alfabética dentro de cada grupo
  const ordenados = useMemo(
    () =>
      [...servicos].sort((a, b) => {
        if (a.ativo !== b.ativo) return a.ativo ? -1 : 1
        return a.nome.localeCompare(b.nome, 'pt-BR')
      }),
    [servicos],
  )

  function aoSalvar(msg: string) {
    setModalAberto(false)
    setEditando(null)
    setAviso(msg)
    void carregar()
    window.setTimeout(() => setAviso(null), 2500)
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-texto">Serviços</h1>
        <Botao
          onClick={() => {
            setEditando(null)
            setModalAberto(true)
          }}
        >
          Novo serviço
        </Botao>
      </div>
      <p className="mt-1 text-sm text-suave">
        A duração define quanto tempo o serviço ocupa na agenda (a agenda chega na Fase 2).
      </p>

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
      ) : ordenados.length === 0 ? (
        <p className="mt-6 rounded-xl border border-borda bg-surface p-6 text-sm text-suave">
          Nenhum serviço cadastrado ainda. Crie o primeiro para poder agendar.
        </p>
      ) : (
        <>
          {/* Tabela — desktop */}
          <table className="mt-6 hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-borda text-left text-xs uppercase tracking-wide text-suave">
                <th className="py-2 pr-3">Serviço</th>
                <th className="py-2 pr-3">Duração</th>
                <th className="py-2 pr-3">Preço</th>
                <th className="py-2 pr-3">Situação</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {ordenados.map((s) => (
                <tr key={s.id} className="border-b border-borda/60">
                  <td className="py-3 pr-3 font-medium text-texto">{s.nome}</td>
                  <td className="py-3 pr-3 text-suave">{s.duracaoMin} min</td>
                  <td className="py-3 pr-3 text-suave">{formatarCentavos(s.precoCentavos)}</td>
                  <td className="py-3 pr-3">
                    <Chip
                      tipo={s.ativo ? 'servico_ativo' : 'servico_inativo'}
                      rotulo={s.ativo ? 'Ativo' : 'Inativo'}
                    />
                  </td>
                  <td className="py-3 text-right">
                    <Botao
                      variante="fantasma"
                      onClick={() => {
                        setEditando(s)
                        setModalAberto(true)
                      }}
                    >
                      Editar
                    </Botao>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Cards — mobile */}
          <ul className="mt-6 flex flex-col gap-3 md:hidden">
            {ordenados.map((s) => (
              <li key={s.id} className="rounded-xl border border-borda bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="block font-medium text-texto">{s.nome}</span>
                    <span className="mt-1 block text-sm text-suave">
                      {s.duracaoMin} min · {formatarCentavos(s.precoCentavos)}
                    </span>
                    <span className="mt-2 block">
                      <Chip
                        tipo={s.ativo ? 'servico_ativo' : 'servico_inativo'}
                        rotulo={s.ativo ? 'Ativo' : 'Inativo'}
                      />
                    </span>
                  </div>
                  <Botao
                    variante="fantasma"
                    onClick={() => {
                      setEditando(s)
                      setModalAberto(true)
                    }}
                  >
                    Editar
                  </Botao>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ModalServico
        aberto={modalAberto}
        onFechar={() => {
          setModalAberto(false)
          setEditando(null)
        }}
        servico={editando}
        onSalvo={aoSalvar}
      />
    </section>
  )
}
