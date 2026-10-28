import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Botao } from '../../components/ui/Botao'
import { Campo, CampoSelect } from '../../components/ui/Campo'
import { CascaModal } from '../../components/ui/CascaModal'
import { traduzErro } from '../../lib/sessao'
import { criarTarefa } from '../../services/pacientes'
import type { Membro } from '../../types'

const esquema = z.object({
  titulo: z.string().trim().min(2, 'Escreva o que precisa ser feito (mín. 2 letras).'),
  responsavelId: z.string().optional(),
  prazo: z.string().optional(),
})

interface Props {
  aberto: boolean
  onFechar: () => void
  pacienteId: string
  membros: Membro[]
  onSalvo: () => void
}

export function ModalTarefa({ aberto, onFechar, pacienteId, membros, onSalvo }: Props) {
  const valoresIniciais = useMemo<z.infer<typeof esquema>>(
    () => ({ titulo: '', responsavelId: '', prazo: '' }),
    [],
  )
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<z.infer<typeof esquema>>({ resolver: zodResolver(esquema), defaultValues: valoresIniciais })

  // toda abertura recomeça limpa — form nunca herda rascunho
  useEffect(() => {
    if (aberto) reset(valoresIniciais)
  }, [aberto, reset, valoresIniciais])

  async function aoEnviar(dados: z.infer<typeof esquema>) {
    try {
      await criarTarefa(pacienteId, dados.titulo, dados.responsavelId || null, dados.prazo || null)
      reset()
      onSalvo()
    } catch (e) {
      setError('root', { message: traduzErro(e) })
    }
  }

  return (
    <CascaModal aberto={aberto} onFechar={onFechar} titulo="Nova tarefa">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(aoEnviar)} noValidate>
        <Campo label="O que fazer" placeholder="Retornar ligação sobre orçamento" erro={errors.titulo?.message} {...register('titulo')} />
        <CampoSelect label="Responsável (opcional)" {...register('responsavelId')}>
          <option value="">— Definir depois —</option>
          {membros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.email}
            </option>
          ))}
        </CampoSelect>
        <Campo label="Prazo (opcional)" type="date" erro={errors.prazo?.message} {...register('prazo')} />
        {errors.root?.message && (
          <p role="alert" className="text-sm text-perigo">
            {errors.root.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Botao type="button" variante="fantasma" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" carregando={isSubmitting}>
            Criar tarefa
          </Botao>
        </div>
      </form>
    </CascaModal>
  )
}
