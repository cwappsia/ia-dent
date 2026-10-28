import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Botao } from '../../components/ui/Botao'
import { Campo, CampoSelect } from '../../components/ui/Campo'
import { CascaModal } from '../../components/ui/CascaModal'
import { paraIsoUtc } from '../../lib/datas'
import { traduzErro } from '../../lib/sessao'
import { criarBloqueio } from '../../services/agenda'
import type { Membro } from '../../types'

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/
const DATA = /^\d{4}-\d{2}-\d{2}$/

const esquema = z
  .object({
    titulo: z.string().trim().min(2, 'Diga o motivo do bloqueio (mín. 2 letras).'),
    profissionalId: z.string().min(1, 'Escolha o profissional.'),
    data: z.string().regex(DATA, 'Informe a data.'),
    inicio: z.string().regex(HORA, 'Hora inválida.'),
    fim: z.string().regex(HORA, 'Hora inválida.'),
  })
  .refine((d) => d.fim > d.inicio, { message: 'O fim precisa ser depois do início.', path: ['fim'] })

type Form = z.infer<typeof esquema>

interface Props {
  aberto: boolean
  onFechar: () => void
  onSalvo: () => void
  profissionais: Membro[]
  profissionalInicial: string
  fuso: string
}

export function ModalBloqueio({ aberto, onFechar, onSalvo, profissionais, profissionalInicial, fuso }: Props) {
  const valoresIniciais = useMemo<Form>(
    () => ({
      titulo: '',
      profissionalId: profissionalInicial,
      data: new Date().toISOString().slice(0, 10),
      inicio: '12:00',
      fim: '13:00',
    }),
    [profissionalInicial],
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Form>({ resolver: zodResolver(esquema), defaultValues: valoresIniciais })

  useEffect(() => {
    if (aberto) reset(valoresIniciais)
  }, [aberto, reset, valoresIniciais])

  async function aoEnviar(dados: Form) {
    try {
      await criarBloqueio(
        dados.profissionalId,
        dados.titulo,
        paraIsoUtc(dados.data, dados.inicio, fuso),
        paraIsoUtc(dados.data, dados.fim, fuso),
      )
      onSalvo()
    } catch (e) {
      setError('root', { message: traduzErro(e) })
    }
  }

  return (
    <CascaModal aberto={aberto} onFechar={onFechar} titulo="Bloquear horário">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(aoEnviar)} noValidate>
        <Campo
          label="Motivo do bloqueio"
          placeholder="Almoço, congresso, folga…"
          erro={errors.titulo?.message}
          {...register('titulo')}
        />
        <CampoSelect
          label="Profissional"
          erro={errors.profissionalId?.message}
          {...register('profissionalId')}
        >
          {profissionais.map((m) => (
            <option key={m.id} value={m.id}>
              {m.email}
            </option>
          ))}
        </CampoSelect>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo label="Data" type="date" erro={errors.data?.message} {...register('data')} />
          <Campo label="Início" type="time" erro={errors.inicio?.message} {...register('inicio')} />
          <Campo label="Fim" type="time" erro={errors.fim?.message} {...register('fim')} />
        </div>
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
            Bloquear
          </Botao>
        </div>
      </form>
    </CascaModal>
  )
}
