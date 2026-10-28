import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { msgConfirmacao } from '../../lib/mensagem'
import { Botao } from '../../components/ui/Botao'
import { Campo } from '../../components/ui/Campo'
import { formatarCentavos } from '../../lib/dinheiro'
import { telefoneValido } from '../../lib/telefone'
import { dataLocalBR, diaCurto, dataPorExtenso } from '../../lib/datas'
import { proximosDias, resumoHorario, slotsDoDia, type Slot } from '../../lib/slots'
import {
  agendarPublico,
  carregarAgendaPublica,
  ocupadosDoDia,
  type AgendaPublica,
  type AgendamentoFeito,
  type ServicoPublico,
} from '../../services/agendarPublico'

type Passo = 'servico' | 'horario' | 'dados' | 'pronto'

const esquema = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome.'),
  email: z.string().trim().email('Informe um e-mail válido.'),
  telefone: z
    .string()
    .trim()
    .refine((v) => telefoneValido(v), 'Informe um telefone válido com DDD.'),
})
type Form = z.infer<typeof esquema>

function linkWhatsappTexto(numero: string, texto: string): string {
  return `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`
}

export default function TelaAgendarPublico() {
  const { slug = '' } = useParams()
  const [agenda, setAgenda] = useState<AgendaPublica | null | 'erro'>(null)
  const [passo, setPasso] = useState<Passo>('servico')
  const [servico, setServico] = useState<ServicoPublico | null>(null)
  const [dataSel, setDataSel] = useState('')
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [slotSel, setSlotSel] = useState<Slot | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [feito, setFeito] = useState<AgendamentoFeito | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(esquema) })

  useEffect(() => {
    document.title = 'Agendar consulta — IA.Dent'
    let vivo = true
    ;(async () => {
      try {
        const a = await carregarAgendaPublica(slug)
        if (!vivo) return
        setAgenda(a)
        if (a) document.title = `Agendar — ${a.clinica.nome}`
      } catch {
        if (vivo) setAgenda('erro')
      }
    })()
    return () => {
      vivo = false
    }
  }, [slug])

  if (agenda === null) return <p className="mt-8 text-sm text-suave">Carregando…</p>
  if (agenda === 'erro' || !agenda?.clinica)
    return (
      <div className="mt-8">
        <h1 className="text-xl font-semibold text-texto">Clínica não encontrada</h1>
        <p className="mt-2 text-sm text-suave">Confira o link de agendamento com a clínica.</p>
      </div>
    )

  const fuso = agenda.clinica.fuso
  const hoje = dataLocalBR(new Date().toISOString(), fuso)
  const passoAtual = passo === 'servico' ? 1 : passo === 'horario' ? 2 : passo === 'dados' ? 3 : 0

  async function escolherDia(data: string) {
    setDataSel(data)
    setSlotSel(null)
    setSlots(null)
    try {
      const ocupados = await ocupadosDoDia(slug, data, agenda && agenda !== 'erro' ? agenda.profissional_id : null)
      setSlots(slotsDoDia(agenda !== 'erro' && agenda ? agenda.clinica.expediente : { dias: [], inicio: '00:00', fim: '00:00' }, servico?.duracao ?? 30, data, fuso, ocupados))
    } catch {
      setErro('Não consegui buscar os horários. Tente de novo.')
    }
  }

  async function aoEnviar(form: Form) {
    if (!servico || !slotSel) return
    setEnviando(true)
    setErro(null)
    try {
      const resultado = await agendarPublico({
        slug,
        servicoId: servico.id,
        inicioIso: slotSel.isoInicio,
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
      })
      setFeito(resultado)
      setPasso('pronto')
    } catch (e) {
      const msg = (e as Error).message
      setErro(msg)
      if (msg.includes('preenchido') || msg.includes('funcionamento')) {
        setPasso('horario')
        setSlotSel(null)
        if (dataSel) void escolherDia(dataSel)
      }
    } finally {
      setEnviando(false)
    }
  }

  function recomecar() {
    setPasso('servico')
    setServico(null)
    setDataSel('')
    setSlots(null)
    setSlotSel(null)
    setFeito(null)
    setErro(null)
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <header className="mt-6">
        <p className="text-sm text-suave">{agenda.clinica.nome}</p>
        <h1 className="text-xl font-semibold text-texto">
          {passo === 'pronto' ? 'Consulta agendada!' : 'Agendar consulta'}
        </h1>
        {passoAtual > 0 && (
          <div className="mt-3" aria-label={`Passo ${passoAtual} de 3`}>
            <p className="text-xs text-suave">
              Passo {passoAtual} de 3 — {passoAtual === 1 ? 'serviço' : passoAtual === 2 ? 'horário' : 'seus dados'}
            </p>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-alta">
              <div
                className="h-full rounded-full bg-primaria transition-all"
                style={{ width: `${(passoAtual / 3) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {erro && passo !== 'dados' && (
        <p role="alert" className="mt-4 text-sm text-perigo">
          {erro}
        </p>
      )}

      {passo === 'servico' && (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-suave">Escolha o serviço</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {agenda.servicos.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => {
                    setServico(s)
                    setPasso('horario')
                    setErro(null)
                    const primeiroDia = proximosDias(agenda.clinica.expediente, hoje)[0]
                    if (primeiroDia) void escolherDia(primeiroDia)
                  }}
                  className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-borda bg-surface p-4 text-left hover:bg-surface-alta"
                >
                  <span>
                    <span className="block text-sm font-medium text-texto">{s.nome}</span>
                    <span className="block text-xs text-suave">{s.duracao} minutos</span>
                  </span>
                  <span className="text-sm text-texto">
                    {s.preco !== null ? formatarCentavos(s.preco) : ''}
                  </span>
                </button>
              </li>
            ))}
            {agenda.servicos.length === 0 && (
              <li className="rounded-xl border border-borda bg-surface p-6 text-sm text-suave">
                Nenhum serviço disponível no momento.
              </li>
            )}
          </ul>
        </section>
      )}

      {passo === 'horario' && servico && (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-suave">
            {servico.nome} · {servico.duracao} min
          </h2>
          <p className="mt-3 text-sm text-suave">Escolha o dia</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {proximosDias(agenda.clinica.expediente, hoje).map((d) => (
              <button
                key={d}
                onClick={() => void escolherDia(d)}
                aria-pressed={dataSel === d}
                className={`min-h-[44px] rounded-lg border px-3 text-sm ${
                  dataSel === d
                    ? 'border-primaria bg-primaria/15 font-medium text-primaria-forte'
                    : 'border-borda text-suave hover:bg-surface-alta'
                }`}
              >
                {diaCurto(d)}
              </button>
            ))}
          </div>

          {dataSel && (
            <>
              <p className="mt-5 text-sm text-suave">{dataPorExtenso(dataSel)} — escolha o horário</p>
              {slots === null ? (
                <p className="mt-3 text-sm text-suave">Buscando horários…</p>
              ) : slots.length === 0 ? (
                <p className="mt-3 text-sm text-suave">Sem horários livres neste dia. Escolha outro.</p>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => (
                    <button
                      key={s.isoInicio}
                      onClick={() => setSlotSel(s)}
                      aria-pressed={slotSel?.isoInicio === s.isoInicio}
                      className={`min-h-[44px] rounded-lg border text-sm ${
                        slotSel?.isoInicio === s.isoInicio
                          ? 'border-primaria bg-primaria/15 font-medium text-primaria-forte'
                          : 'border-borda text-texto hover:bg-surface-alta'
                      }`}
                    >
                      {s.hora}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Botao variante="fantasma" onClick={() => setPasso('servico')}>
              ← Voltar
            </Botao>
            <Botao disabled={!slotSel} onClick={() => setPasso('dados')}>
              Continuar
            </Botao>
          </div>
        </section>
      )}

      {passo === 'dados' && servico && slotSel && (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-suave">
            {servico.nome} · {dataPorExtenso(dataSel)} às {slotSel.hora}
          </h2>
          <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit(aoEnviar)} noValidate>
            <Campo label="Seu nome" erro={errors.nome?.message} {...register('nome')} />
            <Campo label="E-mail" type="email" erro={errors.email?.message} {...register('email')} />
            <Campo
              label="Telefone com DDD"
              placeholder="(15) 99999-8888"
              erro={errors.telefone?.message}
              {...register('telefone')}
            />
            <p className="text-xs text-suave">
              Usamos seus dados só para organizar o seu atendimento nesta clínica — nada de
              publicidade. Veja a{' '}
              <Link to="/privacidade" className="underline hover:text-texto">
                política de privacidade
              </Link>
              .
            </p>
            {erro && (
              <p role="alert" className="text-sm text-perigo">
                {erro}
              </p>
            )}
            <div className="flex items-center justify-between">
              <Botao type="button" variante="fantasma" onClick={() => setPasso('horario')}>
                ← Voltar
              </Botao>
              <Botao type="submit" carregando={enviando}>
                Confirmar agendamento
              </Botao>
            </div>
          </form>
        </section>
      )}

      {passo === 'pronto' && feito && (
        <section className="mt-6">
          <div className="rounded-xl border border-borda bg-surface p-6">
            <p className="text-2xl" aria-hidden>
              ✓
            </p>
            <p className="mt-2 text-sm text-suave">{feito.clinica}</p>
            <p className="text-lg font-semibold text-texto">
              {feito.servico} — {resumoHorario(feito.inicio, fuso)}
            </p>
            <p className="mt-2 text-sm text-suave">
              A clínica vai confirmar por telefone. Chegando antes, é só pedir.
            </p>
            {feito.whatsapp && (
              <a
                className="mt-5 inline-flex min-h-[44px] items-center rounded-lg bg-primaria px-4 text-sm font-medium text-fundo hover:brightness-110"
                href={linkWhatsappTexto(feito.whatsapp, msgConfirmacao(feito, getValues(), fuso))}
                target="_blank"
                rel="noreferrer"
              >
                Confirmar no WhatsApp
              </a>
            )}
            {feito.whatsapp && (
              <p className="mt-3 max-w-xl whitespace-pre-line rounded-lg border border-borda bg-surface-alta p-3 text-xs text-suave">
                {msgConfirmacao(feito, getValues(), fuso)}
              </p>
            )}
          </div>
          <Botao variante="fantasma" onClick={recomecar}>
            Fazer outro agendamento
          </Botao>
        </section>
      )}
    </div>
  )
}
