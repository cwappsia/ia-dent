import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTravarScroll } from '../../app/hooks/useTravarScroll'
import { Botao } from '../../components/ui/Botao'
import { Campo } from '../../components/ui/Campo'
import { Chip } from '../../components/ui/Chip'
import { listarPacientes } from '../../services/pacientes'
import { pacienteCombina } from '../../lib/busca'
import { formatarTelefone } from '../../lib/telefone'
import { ORIGENS, STATUS_PACIENTE, type Paciente } from '../../types'
import { ModalPaciente } from './ModalPaciente'

export default function TelaPacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  useTravarScroll(modalAberto)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      setPacientes(await listarPacientes())
    } catch {
      setErro('Não consegui carregar a lista. Tente de novo.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const visiveis = useMemo(() => pacientes.filter((p) => pacienteCombina(p, busca)), [pacientes, busca])

  function aoSalvar(msg: string) {
    setModalAberto(false)
    setAviso(msg)
    void carregar()
    window.setTimeout(() => setAviso(null), 2500)
  }

  const rotuloOrigem = (o: string) => ORIGENS.find((x) => x.valor === o)?.rotulo ?? o
  const rotuloStatus = (s: string) => STATUS_PACIENTE.find((x) => x.valor === s)?.rotulo ?? s

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-texto">Pacientes</h1>
        <Botao onClick={() => setModalAberto(true)}>Novo paciente</Botao>
      </div>

      <div className="mt-4 max-w-sm">
        <Campo
          label="Buscar"
          placeholder="Nome, telefone, CPF ou e-mail"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
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

      {carregando ? (
        <p className="mt-6 text-sm text-suave">Carregando…</p>
      ) : visiveis.length === 0 ? (
        <p className="mt-6 rounded-xl border border-borda bg-surface p-6 text-sm text-suave">
          {busca
            ? 'Ninguém encontrado com essa busca.'
            : 'Nenhum paciente cadastrado ainda. Crie o primeiro.'}
        </p>
      ) : (
        <>
          {/* Tabela — desktop */}
          <table className="mt-6 hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-borda text-left text-xs uppercase tracking-wide text-suave">
                <th className="py-2 pr-3">Nome</th>
                <th className="py-2 pr-3">Telefone</th>
                <th className="py-2 pr-3">E-mail</th>
                <th className="py-2 pr-3">Origem</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((p) => (
                <tr key={p.id} className="border-b border-borda/60">
                  <td className="py-3 pr-3">
                    <Link className="font-medium text-texto hover:text-primaria-forte" to={`/pacientes/${p.id}`}>
                      {p.nome}
                    </Link>
                  </td>
                  <td className="py-3 pr-3 text-suave">{formatarTelefone(p.telefone)}</td>
                  <td className="py-3 pr-3 text-suave">{p.email ?? '—'}</td>
                  <td className="py-3 pr-3 text-suave">{rotuloOrigem(p.origem)}</td>
                  <td className="py-3">
                    <Chip tipo={p.status} rotulo={rotuloStatus(p.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Cards — mobile */}
          <ul className="mt-6 flex flex-col gap-3 md:hidden">
            {visiveis.map((p) => (
              <li key={p.id}>
                <Link
                  className="block rounded-xl border border-borda bg-surface p-4"
                  to={`/pacientes/${p.id}`}
                >
                  <span className="block font-medium text-texto">{p.nome}</span>
                  <span className="mt-1 block text-sm text-suave">{formatarTelefone(p.telefone)}</span>
                  <span className="mt-2 block">
                    <Chip tipo={p.status} rotulo={rotuloStatus(p.status)} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <ModalPaciente
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvo={aoSalvar}
        outrosPacientes={pacientes}
      />
    </section>
  )
}
