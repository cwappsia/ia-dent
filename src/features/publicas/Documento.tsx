import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Rodape from '../../app/Rodape'

function PaginaDocumento({ titulo, aviso, children }: { titulo: string; aviso: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-semibold text-texto">{titulo}</h1>
      <p className="mt-2 rounded-lg border border-borda bg-surface p-3 text-xs text-suave">{aviso}</p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-suave">{children}</div>
      <p className="mt-8">
        <Link to="/login" className="text-sm text-primaria-forte underline">
          Voltar ao login
        </Link>
      </p>
      <Rodape />
    </div>
  )
}

export function TelaPrivacidade() {
  return (
    <PaginaDocumento
      titulo="Política de Privacidade"
      aviso="Rascunho de desenvolvimento — revisar com advogado antes do piloto com dados reais."
    >
      <h2 className="font-semibold text-texto">1. Quem trata os seus dados</h2>
      <p>
        A clínica em que você é paciente é a <strong>controladora</strong> dos seus dados. A CW IA Apps,
        responsável pelo sistema IA.Dent, atua como <strong>operadora</strong>, tratando dados apenas por
        instrução da clínica.
      </p>
      <h2 className="font-semibold text-texto">2. Quais dados coletamos</h2>
      <p>
        <strong>Equipe da clínica:</strong> e-mail e senha (para acesso ao sistema).{' '}
        <strong>Pacientes:</strong> nome, telefone/WhatsApp, e-mail, data de nascimento e CPF (opcional),
        além do histórico de agendamentos. Coletamos apenas o necessário para o funcionamento do serviço.
      </p>
      <h2 className="font-semibold text-texto">3. Para que usamos</h2>
      <p>
        Organizar o atendimento da clínica: agenda, cadastro, acompanhamento de consultas e comunicação
        sobre seus agendamentos. Nenhum dado é vendido ou usado para publicidade.
      </p>
      <h2 className="font-semibold text-texto">4. Com quem compartilhamos</h2>
      <p>
        Fornecedores de infraestrutura necessários à operação: Supabase (banco de dados e autenticação) e
        Vercel (hospedagem). Não há rastreadores de terceiros neste sistema.
      </p>
      <h2 className="font-semibold text-texto">5. Seus direitos</h2>
      <p>
        Você pode pedir à clínica acesso, correção ou exclusão dos seus dados. A clínica pode excluir
        o cadastro de um paciente a qualquer momento no sistema; a remoção completa da clínica e o
        envio de uma cópia dos dados podem ser solicitados ao nosso suporte (contato no rodapé).
      </p>
      <h2 className="font-semibold text-texto">6. Contato e retenção</h2>
      <p>
        Canal do encarregado de dados (DPO): <em>a definir antes do piloto</em>. Os dados são mantidos
        enquanto a conta da clínica existir ou até a exclusão solicitada.
      </p>
    </PaginaDocumento>
  )
}

export function TelaTermos() {
  return (
    <PaginaDocumento
      titulo="Termos de Uso"
      aviso="Rascunho de desenvolvimento — revisar com advogado antes do piloto com dados reais."
    >
      <h2 className="font-semibold text-texto">1. O que é o IA.Dent</h2>
      <p>
        Sistema de gestão para consultórios odontológicos oferecido por assinatura pela CW IA Apps. O
        acesso é pessoal e intransferível.
      </p>
      <h2 className="font-semibold text-texto">2. Responsabilidades</h2>
      <p>
        A clínica é responsável pela veracidade dos dados que cadastra e pelo cumprimento das obrigações
        legais do seu atendimento. O IA.Dent é uma ferramenta administrativa e <strong>não substitui</strong>{' '}
        avaliação clínica, diagnóstico ou registro profissional exigido pelo CFO.
      </p>
      <h2 className="font-semibold text-texto">3. Uso da conta</h2>
      <p>
        Não compartilhe sua senha. Convites de equipe devem ser feitos pelo sistema. O uso indevido pode
        resultar em suspensão do acesso.
      </p>
      <h2 className="font-semibold text-texto">4. Cancelamento</h2>
      <p>
        Condições de cancelamento, reembolso e prazo de aviso: <em>a definir junto com a cobrança, antes
        da comercialização</em>.
      </p>
      <h2 className="font-semibold text-texto">5. Alterações e foro</h2>
      <p>
        Estes termos podem ser atualizados; mudanças relevantes serão comunicadas dentro do sistema.
        Foro e legislação aplicável: <em>a definir com o advogado</em>.
      </p>
    </PaginaDocumento>
  )
}
