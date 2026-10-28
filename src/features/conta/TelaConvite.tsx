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
  codigo: z.string().min(4, 'Informe o código do convite.'),
})
type Formulario = z.infer<typeof esquema>

export default function TelaConvite() {
  const { aceitarConvite, sair } = useSessao()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Formulario>({ resolver: zodResolver(esquema) })

  async function aoEnviar(dados: Formulario) {
    try {
      const nova = await aceitarConvite(dados.codigo)
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
        <h1 className="text-lg font-semibold text-texto">Entrar numa clínica</h1>
        <p className="mt-1 text-sm text-suave">
          Digite o código que a clínica te enviou para juntar-se à equipe.
        </p>
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(aoEnviar)} noValidate>
          <Campo
            label="Código do convite"
            placeholder="ex.: 7K2MQ9WX"
            autoCapitalize="characters"
            erro={errors.codigo?.message}
            {...register('codigo')}
          />
          {errors.root?.message && (
            <p role="alert" className="text-sm text-perigo">
              {errors.root.message}
            </p>
          )}
          <Botao type="submit" carregando={isSubmitting}>
            Entrar na clínica
          </Botao>
        </form>
        <p className="mt-4 text-sm text-suave">
          Quer criar sua própria clínica?{' '}
          <Link className="font-medium text-primaria-forte underline" to="/onboarding">
            Criar clínica
          </Link>
        </p>
        <button onClick={() => void sair()} className="mt-2 text-xs text-suave underline hover:text-texto">
          Sair desta conta
        </button>
      </div>
    </div>
  )
}
