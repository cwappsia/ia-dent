import { describe, expect, it } from 'vitest'
import { resolverDestino, rotaDoDestino, traduzErro } from './sessao'

describe('resolverDestino', () => {
  it('usuário sem sessão e carregando vão pro login', () => {
    expect(resolverDestino({ fase: 'sem-usuario' })).toBe('login')
    expect(resolverDestino({ fase: 'carregando' })).toBe('login')
  })

  it('sem clínica vai pro onboarding', () => {
    expect(resolverDestino({ fase: 'sem-clinica', userId: 'u1' })).toBe('onboarding')
  })

  it('equipe vai pro app e paciente pro portal', () => {
    expect(
      resolverDestino({
        fase: 'equipe',
        userId: 'u1',
        papel: 'owner',
        clinica: {
          id: 'c1',
          name: 'Clínica Teste',
          slug: 'clinica-teste',
          status: 'ativa',
          timezone: 'America/Sao_Paulo',
          horario_padrao: { dias: [1, 2, 3, 4, 5], inicio: '08:00', fim: '18:00' },
          duracao_padrao_consulta: 30,
          whatsapp: null,
          nome_profissional: null,
          registro_profissional: null,
        },
      }),
    ).toBe('app')
    expect(resolverDestino({ fase: 'paciente', userId: 'u2', patientId: 'p1' })).toBe('portal')
  })
})

describe('rotaDoDestino', () => {
  it('cada destino tem rota fixa', () => {
    expect(rotaDoDestino('login')).toBe('/login')
    expect(rotaDoDestino('app')).toBe('/')
    expect(rotaDoDestino('portal')).toBe('/meus-agendamentos')
    expect(rotaDoDestino('onboarding')).toBe('/onboarding')
  })
})

describe('traduzErro', () => {
  it('traduz erros conhecidos em mensagens humanas', () => {
    expect(traduzErro({ message: 'Invalid login credentials' })).toBe('E-mail ou senha incorretos.')
    expect(traduzErro({ message: 'User already registered' })).toContain('já tem uma conta')
    expect(traduzErro({ message: 'JA_TEM_CLINICA' })).toContain('já faz parte')
    expect(traduzErro({ message: 'ACEITE_OBRIGATORIO' })).toContain('aceitar os termos')
    expect(traduzErro({ message: 'CONVITE_INVALIDO' })).toContain('inválido ou expirado')
  })

  it('erro desconhecido cai em mensagem genérica, nunca em jargão', () => {
    expect(traduzErro({ message: 'PGRST205 whatever' })).toBe('Algo deu errado. Tente novamente.')
    expect(traduzErro(null)).toBe('Algo deu errado. Tente novamente.')
  })
})
