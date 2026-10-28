import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Botao } from '../../components/ui/Botao'
import { Campo } from '../../components/ui/Campo'
import { CascaModal } from '../../components/ui/CascaModal'
import { parseCentavos } from '../../lib/dinheiro'
import { traduzErro } from '../../lib/sessao'
import { atualizarServico, criarServico } from '../../services/servicos'
import type { Servico } from '../../types'

const esquema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome (mín. 2 letras).'),
  duracao: z
    .string()
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 5 && Number(v) <= 480, {
      message: 'Duração entre 5 e 480 minutos.',
    }),
  preco: z.string().optional(),
  ativo: z.boolean(),
})

interface Props {
  aberto: boolean
  onFechar: () => void
  onSalvo: (msg: string) => void
  servico?: Servico | null
}

export function ModalServico({ aberto, onFechar, onSalvo, servico }: Props) {
  const editando = !!servico
  const valoresIniciais = useMemo<z.infer<typeof esquema>>(
    () =>
      servico
        ? {
            nome: servico.nome,
            duracao: String(servico.duracaoMin),
            preco: servico.precoCentavos !== null ? (servico.precoCentavos / 100).toFixed(2).replace('.', ',') : '',
            ativo: servico.ativo,
          }
        : { nome: '', duracao: '30', preco: '', ativo: true },
    [servico],
  )
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<z.infer<typeof esquema>>({ resolver: zodResolver(esquema), defaultValues: valoresIniciais })

  // toda abertura espelha o serviço atual (ou vem limpa) — nunca herda rascunho
  useEffect(() => {
    if (aberto) reset(valoresIniciais)
  }, [aberto, reset, valoresIniciais])

  async function aoEnviar(dados: z.infer<typeof esquema>) {
    try {
      const payload = {
        nome: dados.nome,
        duracaoMin: Number(dados.duracao),
        precoCentavos: parseCentavos(dados.preco),
        ativo: dados.ativo,
      }
      if (editando && servico) {
        await atualizarServico(servico.id, payload)
        onSalvo('Serviço atualizado.')
      } else {
        await criarServico(payload)
        onSalvo('Serviço criado.')
      }
    } catch (e) {
      setError('root', { message: traduzErro(e) })
    }
  }

  return (
    <CascaModal aberto={aberto} onFechar={onFechar} titulo={editando ? 'Editar serviço' : 'Novo serviço'}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(aoEnviar)} noValidate>
        <Campo label="Nome do serviço" placeholder="Limpeza" erro={errors.nome?.message} {...register('nome')} />
        <Campo
          label="Duração (minutos)"
          type="number"
          inputMode="numeric"
          min={5}
          max={480}
          erro={errors.duracao?.message}
          {...register('duracao')}
        />
        <Campo
          label="Preço (opcional)"
          placeholder="150,00 — use vírgula"
          inputMode="decimal"
          erro={errors.preco?.message}
          {...register('preco')}
        />
        {editando && (
          <label className="flex items-center gap-3 text-sm text-suave">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-borda accent-[var(--pri)]"
              {...register('ativo')}
            />
            Serviço ativo (aparece na agenda e no link público)
          </label>
        )}
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
            {editando ? 'Salvar alterações' : 'Criar serviço'}
          </Botao>
        </div>
      </form>
    </CascaModal>
  )
}
