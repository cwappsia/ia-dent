import { useState } from 'react'
import { Botao } from '../../components/ui/Botao'
import { CascaModal } from '../../components/ui/CascaModal'
import { traduzErro } from '../../lib/sessao'
import { excluirPaciente } from '../../services/pacientes'
import type { Paciente } from '../../types'

interface Props {
  aberto: boolean
  onFechar: () => void
  paciente: Paciente
  onExcluido: () => void
}

export function ModalExcluirPaciente({ aberto, onFechar, paciente, onExcluido }: Props) {
  const [erro, setErro] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  async function aoExcluir() {
    setExcluindo(true)
    setErro(null)
    try {
      await excluirPaciente(paciente.id)
      onExcluido()
    } catch (e) {
      setErro(traduzErro(e))
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <CascaModal aberto={aberto} onFechar={onFechar} titulo="Excluir paciente">
      <p className="text-sm text-suave">
        Excluir <strong className="text-texto">{paciente.nome}</strong> apaga junto todas as interações e
        tarefas registradas. Isso não tem volta.
      </p>
      {erro && (
        <p role="alert" className="mt-3 text-sm text-perigo">
          {erro}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Botao variante="fantasma" onClick={onFechar}>
          Cancelar
        </Botao>
        <Botao variante="perigo" carregando={excluindo} onClick={() => void aoExcluir()}>
          Excluir definitivamente
        </Botao>
      </div>
    </CascaModal>
  )
}
