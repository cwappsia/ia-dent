import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Botao } from '../../components/ui/Botao'
import { CampoSelect, CampoTexto } from '../../components/ui/Campo'
import { CascaModal } from '../../components/ui/CascaModal'
import { traduzErro } from '../../lib/sessao'
import { criarInteracao } from '../../services/pacientes'
import { TIPOS_INTERACAO } from '../../types'

const esquema = z.object({
  tipo: z.enum(['ligacao', 'whatsapp', 'email', 'consulta_presencial', 'visita', 'outro']),
  resumo: z.string().trim().min(2, 'Escreva o resumo (mín. 2 letras).'),
})

interface Props {
  aberto: boolean
  onFechar: () => void
  pacienteId: string
  onSalvo: () => void
}

export function ModalInteracao({ aberto, onFechar, pacienteId, onSalvo }: Props) {
  const valoresIniciais = useMemo<z.infer<typeof esquema>>(() => ({ tipo: 'ligacao', resumo: '' }), [])
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
      await criarInteracao(pacienteId, dados.tipo, dados.resumo)
      reset()
      onSalvo()
    } catch (e) {
      setError('root', { message: traduzErro(e) })
    }
  }

  return (
    <CascaModal aberto={aberto} onFechar={onFechar} titulo="Registrar interação">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(aoEnviar)} noValidate>
        <CampoSelect label="Tipo" {...register('tipo')}>
          {TIPOS_INTERACAO.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </CampoSelect>
        <CampoTexto
          label="Resumo"
          placeholder="Ligou perguntando sobre valores de limpeza…"
          erro={errors.resumo?.message}
          {...register('resumo')}
        />
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
            Registrar
          </Botao>
        </div>
      </form>
    </CascaModal>
  )
}
