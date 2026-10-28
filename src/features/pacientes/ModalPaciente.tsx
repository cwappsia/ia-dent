import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { CascaModal } from '../../components/ui/CascaModal'
import { Botao } from '../../components/ui/Botao'
import { Campo, CampoSelect, CampoTexto } from '../../components/ui/Campo'
import { traduzErro } from '../../lib/sessao'
import { atualizarPaciente, criarPaciente } from '../../services/pacientes'
import type { Paciente } from '../../types'
import { ORIGENS_CAMPO, STATUS_CAMPO, esquemaPaciente, type FormPaciente } from './validacao'

interface Props {
  aberto: boolean
  onFechar: () => void
  onSalvo: (msg: string) => void
  paciente?: Paciente | null
  outrosPacientes?: Paciente[]
}

const VAZIO: FormPaciente = {
  origem: 'manual',
  status: 'lead',
  nome: '',
  nascimento: '',
  cpf: '',
  telefone: '',
  email: '',
  responsavelId: '',
  observacao: '',
}

/** Criação e edição no mesmo form. Na criação o status nasce 'lead' (regra do funil). */
export function ModalPaciente({ aberto, onFechar, onSalvo, paciente, outrosPacientes = [] }: Props) {
  const editando = !!paciente
  const valoresIniciais = useMemo<FormPaciente>(
    () =>
      paciente
        ? {
            nome: paciente.nome,
            nascimento: paciente.nascimento ?? '',
            cpf: paciente.cpf ?? '',
            telefone: paciente.telefone ?? '',
            email: paciente.email ?? '',
            origem: paciente.origem,
            status: paciente.status,
            responsavelId: paciente.responsavelId ?? '',
            observacao: paciente.observacao ?? '',
          }
        : VAZIO,
    [paciente],
  )
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormPaciente>({ resolver: zodResolver(esquemaPaciente), defaultValues: valoresIniciais })

  // toda abertura recomeça limpa (ou espelha o paciente da edição) — form nunca herda rascunho
  useEffect(() => {
    if (aberto) reset(valoresIniciais)
  }, [aberto, reset, valoresIniciais])

  async function aoEnviar(dados: FormPaciente) {
    try {
      const payload = {
        nome: dados.nome,
        nascimento: dados.nascimento || null,
        cpf: dados.cpf || null,
        telefone: dados.telefone || null,
        email: dados.email || null,
        origem: dados.origem,
        status: dados.status,
        responsavelId: dados.responsavelId || null,
        observacao: dados.observacao || null,
      }
      if (editando && paciente) {
        await atualizarPaciente(paciente.id, payload)
        onSalvo('Cadastro atualizado.')
      } else {
        await criarPaciente({ ...payload, status: 'lead' })
        onSalvo('Paciente salvo.')
      }
    } catch (e) {
      setError('root', { message: traduzErro(e) })
    }
  }

  return (
    <CascaModal aberto={aberto} onFechar={onFechar} titulo={editando ? 'Editar paciente' : 'Novo paciente'}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(aoEnviar)} noValidate>
        <Campo label="Nome completo" erro={errors.nome?.message} placeholder="Maria da Silva" {...register('nome')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nascimento" type="date" erro={errors.nascimento?.message} {...register('nascimento')} />
          <Campo label="CPF (opcional)" placeholder="529.982.247-25" inputMode="numeric" erro={errors.cpf?.message} {...register('cpf')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Telefone / WhatsApp" placeholder="(15) 99999-9999" inputMode="tel" erro={errors.telefone?.message} {...register('telefone')} />
          <Campo label="E-mail (opcional)" type="email" placeholder="maria@exemplo.com" erro={errors.email?.message} {...register('email')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoSelect label="Origem" {...register('origem')}>
            {ORIGENS_CAMPO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </CampoSelect>
          {editando ? (
            <CampoSelect label="Status" {...register('status')}>
              {STATUS_CAMPO.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </CampoSelect>
          ) : (
            <p className="self-end pb-2 text-xs text-suave">
              Novo cadastro entra como <strong>Lead</strong>; troque o status depois.
            </p>
          )}
        </div>
        <CampoSelect label="Responsável financeiro (opcional)" {...register('responsavelId')}>
          <option value="">— Nenhum —</option>
          {outrosPacientes
            .filter((p) => p.id !== paciente?.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
        </CampoSelect>
        <CampoTexto label="Observação administrativa (opcional)" placeholder="Preferências, convênio, avisos…" {...register('observacao')} />
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
            {editando ? 'Salvar alterações' : 'Criar paciente'}
          </Botao>
        </div>
      </form>
    </CascaModal>
  )
}
