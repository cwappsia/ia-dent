import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Botao } from '../../components/ui/Botao'
import { Campo, CampoSelect, CampoTexto } from '../../components/ui/Campo'
import { CascaModal } from '../../components/ui/CascaModal'
import { paraIsoUtc, quebrarIso, textoOuNull } from '../../lib/datas'
import { traduzErro } from '../../lib/sessao'
import { atualizarConsulta, criarConsulta } from '../../services/agenda'
import { STATUS_CONSULTA, type Consulta, type Membro, type Paciente, type Servico } from '../../types'

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/
const DATA = /^\d{4}-\d{2}-\d{2}$/

const esquema = z
  .object({
    pacienteId: z.string().min(1, 'Escolha o paciente.'),
    profissionalId: z.string().min(1, 'Escolha o profissional.'),
    servicoId: z.string().optional(),
    motivo: z.string().optional(),
    data: z.string().regex(DATA, 'Informe a data.'),
    inicio: z.string().regex(HORA, 'Hora inválida.'),
    fim: z.string().regex(HORA, 'Hora inválida.'),
    status: z.enum(['agendado', 'confirmado', 'atendido', 'faltou', 'cancelado']),
  })
  .refine((d) => d.fim > d.inicio, { message: 'O fim precisa ser depois do início.', path: ['fim'] })

type Form = z.infer<typeof esquema>

interface Props {
  aberto: boolean
  onFechar: () => void
  onSalvo: (msg: string) => void
  consulta: Consulta | null
  pacientes: Paciente[]
  profissionais: Membro[]
  servicos: Servico[]
  fuso: string
  duracaoPadrao: number
}

function somarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number)
  const total = h * 60 + m + minutos
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function ModalConsulta({
  aberto,
  onFechar,
  onSalvo,
  consulta,
  pacientes,
  profissionais,
  servicos,
  fuso,
  duracaoPadrao,
}: Props) {
  const editando = !!consulta
  const valoresIniciais = useMemo<Form>(() => {
    const quebrado = consulta ? quebrarIso(consulta.inicio, fuso) : null
    return {
      pacienteId: consulta?.pacienteId ?? '',
      profissionalId: consulta?.profissionalId ?? profissionais[0]?.id ?? '',
      servicoId: consulta?.servicoId ?? '',
      motivo: consulta?.motivo ?? '',
      data: quebrado?.data ?? new Date().toISOString().slice(0, 10),
      inicio: quebrado?.hora ?? '09:00',
      fim: consulta ? (quebrarIso(consulta.fim, fuso)?.hora ?? '') : '',
      status: consulta?.status ?? 'agendado',
    }
  }, [consulta, fuso, profissionais])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Form>({ resolver: zodResolver(esquema), defaultValues: valoresIniciais })

  useEffect(() => {
    if (aberto) reset(valoresIniciais)
  }, [aberto, reset, valoresIniciais])

  const servicoId = watch('servicoId')
  const inicio = watch('inicio')

  // escolher serviço calcula o fim pela duração dele (default: duração padrão da clínica)
  useEffect(() => {
    if (!aberto || !inicio) return
    const duracao = servicos.find((s) => s.id === servicoId)?.duracaoMin ?? duracaoPadrao
    setValue('fim', somarMinutos(inicio, duracao))
  }, [servicoId, inicio, aberto, servicos, duracaoPadrao, setValue])

  async function aoEnviar(dados: Form) {
    try {
      const payload = {
        pacienteId: dados.pacienteId,
        profissionalId: dados.profissionalId,
        servicoId: dados.servicoId || null,
        motivo: textoOuNull(dados.motivo),
        inicioIso: paraIsoUtc(dados.data, dados.inicio, fuso),
        fimIso: paraIsoUtc(dados.data, dados.fim, fuso),
        status: editando ? dados.status : ('agendado' as const),
      }
      if (editando && consulta) {
        await atualizarConsulta(consulta.id, payload)
        onSalvo('Consulta atualizada.')
      } else {
        await criarConsulta(payload)
        onSalvo('Consulta criada.')
      }
    } catch (e) {
      setError('root', { message: traduzErro(e) })
    }
  }

  const semServico = !servicoId

  return (
    <CascaModal aberto={aberto} onFechar={onFechar} titulo={editando ? 'Editar consulta' : 'Nova consulta'}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(aoEnviar)} noValidate>
        <CampoSelect label="Paciente" erro={errors.pacienteId?.message} {...register('pacienteId')}>
          <option value="">— Escolha —</option>
          {pacientes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </CampoSelect>
        <CampoSelect
          label="Profissional"
          erro={errors.profissionalId?.message}
          {...register('profissionalId')}
        >
          <option value="">— Escolha —</option>
          {profissionais.map((m) => (
            <option key={m.id} value={m.id}>
              {m.email}
            </option>
          ))}
        </CampoSelect>
        <CampoSelect label="Serviço" {...register('servicoId')}>
          <option value="">— Motivo livre —</option>
          {servicos.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome} · {s.duracaoMin} min
            </option>
          ))}
        </CampoSelect>
        {semServico && (
          <CampoTexto label="Motivo (opcional)" placeholder="Retorno, avaliação…" {...register('motivo')} />
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo label="Data" type="date" erro={errors.data?.message} {...register('data')} />
          <Campo label="Início" type="time" erro={errors.inicio?.message} {...register('inicio')} />
          <Campo label="Fim" type="time" erro={errors.fim?.message} {...register('fim')} />
        </div>
        {editando && (
          <CampoSelect label="Status" {...register('status')}>
            {STATUS_CONSULTA.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.rotulo}
              </option>
            ))}
          </CampoSelect>
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
            {editando ? 'Salvar alterações' : 'Criar consulta'}
          </Botao>
        </div>
      </form>
    </CascaModal>
  )
}
