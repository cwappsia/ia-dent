import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import {
  traduzErro,
  type Clinica,
  type FaseSessao,
  type Papel,
} from '../../lib/sessao'

type CriarContaResultado =
  | { tipo: 'entrou'; fase: FaseSessao }
  | { tipo: 'confirmar-email' }

interface SessaoCtx {
  fase: FaseSessao
  entrar: (email: string, senha: string) => Promise<FaseSessao>
  criarConta: (email: string, senha: string) => Promise<CriarContaResultado>
  criarClinica: (nome: string, aceite: boolean) => Promise<FaseSessao>
  aceitarConvite: (codigo: string) => Promise<FaseSessao>
  sair: () => Promise<void>
  /** Resolve o papel de novo (ex.: depois de salvar configurações da clínica). */
  recarregarClinica: () => Promise<void>
}

const Ctx = createContext<SessaoCtx | null>(null)

/** Resolve o papel do usuário: membro de clínica → equipe; paciente → portal; senão sem clínica. */
async function resolverFase(userId: string): Promise<FaseSessao> {
  // Best-effort: se o usuário é um lead que criou conta, amarra o patients.user_id
  // pelo e-mail ANTES de decidir a fase (idempotente — segunda chamada não faz nada).
  try {
    await supabase.rpc('vincular_paciente_conta')
  } catch {
    /* vínculo é best-effort: falha não bloqueia o login */
  }

  const { data: membros, error } = await supabase
    .from('clinic_members')
    .select('role, clinics(id, name, slug, status, timezone, horario_padrao, duracao_padrao_consulta, whatsapp, nome_profissional, registro_profissional)')
    .eq('user_id', userId)
    .limit(1)
  if (error) throw new Error(traduzErro(error))
  const m = membros?.[0]
  if (m?.clinics) {
    // embed to-one do PostgREST chega como OBJETO (a inferência do client erra; cast honesto)
    const clinica = m.clinics as unknown as Clinica
    return { fase: 'equipe', userId, papel: m.role as Papel, clinica }
  }
  // A tabela patients só nasce na F1; até lá o erro de schema apenas
  // significa "não é paciente" (dado nulo, sem estourar).
  const { data: pacientes } = await supabase.from('patients').select('id').eq('user_id', userId).limit(1)
  const p = pacientes?.[0]
  if (p) return { fase: 'paciente', userId, patientId: String(p.id) }
  return { fase: 'sem-clinica', userId }
}

async function userIdAtual(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('NAO_AUTENTICADO')
  return data.user.id
}

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [fase, setFase] = useState<FaseSessao>({ fase: 'carregando' })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) {
        setFase({ fase: 'sem-usuario' })
        return
      }
      setFase(await resolverFase(data.session.user.id))
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evento, session) => {
      if (!session?.user) {
        setFase({ fase: 'sem-usuario' })
        return
      }
      setFase(await resolverFase(session.user.id))
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function entrar(email: string, senha: string): Promise<FaseSessao> {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw new Error(traduzErro(error))
    const nova = await resolverFase(await userIdAtual())
    setFase(nova)
    return nova
  }

  async function criarConta(email: string, senha: string): Promise<CriarContaResultado> {
    const { data, error } = await supabase.auth.signUp({ email, password: senha })
    if (error) throw new Error(traduzErro(error))
    if (!data.session) return { tipo: 'confirmar-email' }
    const nova = await resolverFase(data.user!.id)
    setFase(nova)
    return { tipo: 'entrou', fase: nova }
  }

  async function criarClinica(nome: string, aceite: boolean): Promise<FaseSessao> {
    const { error } = await supabase.rpc('criar_clinica', { p_nome: nome, p_aceite_termos: aceite })
    if (error) throw new Error(traduzErro(error))
    const nova = await resolverFase(await userIdAtual())
    setFase(nova)
    return nova
  }

  async function aceitarConvite(codigo: string): Promise<FaseSessao> {
    const { error } = await supabase.rpc('aceitar_convite', { p_codigo: codigo })
    if (error) throw new Error(traduzErro(error))
    const nova = await resolverFase(await userIdAtual())
    setFase(nova)
    return nova
  }

  async function sair() {
    await supabase.auth.signOut()
    setFase({ fase: 'sem-usuario' })
  }

  async function recarregarClinica() {
    const nova = await resolverFase(await userIdAtual())
    setFase(nova)
  }

  return (
    <Ctx.Provider
      value={{ fase, entrar, criarConta, criarClinica, aceitarConvite, sair, recarregarClinica }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useSessao(): SessaoCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSessao fora do SessaoProvider')
  return ctx
}
