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
  senha: z.string().min(8, 'Use pelo menos 8 caracteres.'),
})
type Formulario = z.infer<typeof esquema>

export default function TelaCriarConta() {
  const { criarConta } = useSessao()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Formulario>({ resolver: zodResolver(esquema) })

  async function aoEnviar(dados: Formulario) {
    try {
      const resultado = await criarConta(dados.email, dados.senha)
      if (resultado.tipo === 'confirmar-email') {
        setError('root', {
          message: 'Conta criada! Confirme seu e-mail (enviamos um link) e depois entre.',
        })
        return
      }
      navigate(rotaDoDestino(resolverDestino(resultado.fase)))
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
        <h1 className="text-lg font-semibold text-texto">Criar conta</h1>
        <p className="mt-1 text-sm text-suave">Crie sua conta e configure a clínica em seguida.</p>
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
            label="Senha (mín. 8 caracteres)"
            type="password"
            autoComplete="new-password"
            erro={errors.senha?.message}
            {...register('senha')}
          />
          {errors.root?.message && (
            <p role="alert" className="text-sm text-perigo">
              {errors.root.message}
            </p>
          )}
          <Botao type="submit" carregando={isSubmitting}>
            Criar conta
          </Botao>
        </form>
        <p className="mt-4 text-sm text-suave">
          Já tem conta?{' '}
          <Link className="font-medium text-primaria-forte underline" to="/login">
            Entrar
          </Link>
        </p>
      </div>
      <Rodape />
    </div>
  )
}
