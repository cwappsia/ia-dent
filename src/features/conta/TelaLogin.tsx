import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Rodape from '../../app/Rodape'
import { useSessao } from '../../app/providers/Sessao'
import { Botao } from '../../components/ui/Botao'
import { Campo } from '../../components/ui/Campo'
import { ControleFonte } from '../../components/ui/ControleFonte'
import { Logo } from '../../components/ui/Logo'
import { resolverDestino, rotaDoDestino, traduzErro } from '../../lib/sessao'

const esquema = z.object({
  email: z.string().email('E-mail inválido.'),
  senha: z.string().min(6, 'A senha tem pelo menos 6 caracteres.'),
})
type Formulario = z.infer<typeof esquema>

export default function TelaLogin() {
  const { fase, entrar } = useSessao()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Formulario>({ resolver: zodResolver(esquema) })

  // Já logado → vai direto pro destino do papel
  useEffect(() => {
    if (fase.fase !== 'carregando' && fase.fase !== 'sem-usuario') {
      navigate(rotaDoDestino(resolverDestino(fase)), { replace: true })
    }
  }, [fase, navigate])

  async function aoEnviar(dados: Formulario) {
    try {
      const nova = await entrar(dados.email, dados.senha)
      navigate(rotaDoDestino(resolverDestino(nova)))
    } catch (e) {
      setError('root', { message: traduzErro(e) })
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4">
      <div className="mb-8 flex items-center justify-between">
        <Logo />
        <ControleFonte />
      </div>
      <div className="rounded-xl border border-borda bg-surface p-6">
        <h1 className="text-lg font-semibold text-texto">Entrar</h1>
        <p className="mt-1 text-sm text-suave">Acesse a conta da sua clínica.</p>
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(aoEnviar)} noValidate>
          <Campo
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="voce@clinica.com"
            erro={errors.email?.message}
            {...register('email')}
          />
          <Campo
            label="Senha"
            type="password"
            autoComplete="current-password"
            erro={errors.senha?.message}
            {...register('senha')}
          />
          {errors.root?.message && (
            <p role="alert" className="text-sm text-perigo">
              {errors.root.message}
            </p>
          )}
          <Botao type="submit" carregando={isSubmitting}>
            Entrar
          </Botao>
        </form>
        <p className="mt-4 text-sm text-suave">
          Não tem conta?{' '}
          <Link className="font-medium text-primaria-forte underline" to="/criar-conta">
            Criar conta
          </Link>
        </p>
      </div>
      <Rodape />
    </div>
  )
}
