import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useSessao } from '../../app/providers/Sessao'
import { Botao } from '../../components/ui/Botao'
import { Campo } from '../../components/ui/Campo'
import { Logo } from '../../components/ui/Logo'
import { resolverDestino, rotaDoDestino, traduzErro } from '../../lib/sessao'

const esquema = z.object({
  nome: z.string().min(2, 'Informe o nome da clínica (mín. 2 letras).'),
  aceite: z.boolean().refine((v) => v === true, 'Você precisa aceitar os termos.'),
})
type Formulario = z.infer<typeof esquema>

export default function TelaOnboarding() {
  const { criarClinica, sair } = useSessao()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Formulario>({ resolver: zodResolver(esquema), defaultValues: { aceite: false } })

  async function aoEnviar(dados: Formulario) {
    try {
      const nova = await criarClinica(dados.nome, dados.aceite)
      navigate(rotaDoDestino(resolverDestino(nova)))
    } catch (e) {
      setError('root', { message: traduzErro(e) })
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="rounded-xl border border-borda bg-surface p-6">
        <h1 className="text-lg font-semibold text-texto">Criar sua clínica</h1>
        <p className="mt-1 text-sm text-suave">
          Esse é o nome que seus pacientes veem. O link público de agendamento é gerado a partir dele.
        </p>
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(aoEnviar)} noValidate>
          <Campo
            label="Nome da clínica"
            placeholder="Clínica Sorriso"
            erro={errors.nome?.message}
            {...register('nome')}
          />
          <label className="flex items-start gap-3 text-sm text-suave">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-borda accent-[var(--pri)]"
              {...register('aceite')}
            />
            <span>
              Li e aceito os{' '}
              <Link to="/termos" className="font-medium text-primaria-forte underline">
                Termos de uso
              </Link>{' '}
              e a{' '}
              <Link to="/privacidade" className="font-medium text-primaria-forte underline">
                Política de Privacidade
              </Link>
              .
            </span>
          </label>
          {errors.aceite?.message && (
            <p role="alert" className="text-xs text-perigo">
              {errors.aceite.message}
            </p>
          )}
          {errors.root?.message && (
            <p role="alert" className="text-sm text-perigo">
              {errors.root.message}
            </p>
          )}
          <Botao type="submit" carregando={isSubmitting}>
            Criar clínica
          </Botao>
        </form>
        <p className="mt-4 text-sm text-suave">
          Trabalha numa clínica que já existe?{' '}
          <Link className="font-medium text-primaria-forte underline" to="/convite">
            Usar código de convite
          </Link>
        </p>
        <button onClick={() => void sair()} className="mt-2 text-xs text-suave underline hover:text-texto">
          Sair desta conta
        </button>
      </div>
    </div>
  )
}
