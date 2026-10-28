import { useEffect, useState } from 'react'
import { useSessao } from '../../app/providers/Sessao'
import { Botao } from '../../components/ui/Botao'
import { Campo } from '../../components/ui/Campo'
import { traduzErro } from '../../lib/sessao'
import { telefoneValido } from '../../lib/telefone'
import { atualizarClinica } from '../../services/clinica'

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/

/** Dias ISO: 1 = segunda … 7 = domingo (mesma convenção do banco). */
const DIAS_OPCOES = [
  { valor: 1, rotulo: 'Seg' },
  { valor: 2, rotulo: 'Ter' },
  { valor: 3, rotulo: 'Qua' },
  { valor: 4, rotulo: 'Qui' },
  { valor: 5, rotulo: 'Sex' },
  { valor: 6, rotulo: 'Sáb' },
  { valor: 7, rotulo: 'Dom' },
]

interface Form {
  whatsapp: string
  slug: string
  inicio: string
  fim: string
  duracao: string
  nomeProfissional: string
  registroProfissional: string
}

function validar(d: Form, dias: number[]): string | null {
  if (!HORA.test(d.inicio) || !HORA.test(d.fim)) return 'Horário inválido.'
  if (d.fim <= d.inicio) return 'O fim do expediente precisa ser depois do início.'
  if (!/^[a-z0-9][a-z0-9-]{2,}$/.test(d.slug))
    return 'Link inválido — use letras minúsculas, números e hífen (mín. 3 caracteres).'
  if (d.whatsapp.trim() && !telefoneValido(d.whatsapp)) return 'WhatsApp inválido — use DDD + número.'
  const dur = Number(d.duracao)
  if (!Number.isInteger(dur) || dur < 5 || dur > 480) return 'Duração padrão: entre 5 e 480 minutos.'
  if (dias.length === 0) return 'Marque pelo menos um dia de funcionamento.'
  return null
}

export default function TelaConfiguracoes() {
  const { fase, recarregarClinica } = useSessao()
  const clinica = fase.fase === 'equipe' ? fase.clinica : null
  const papel = fase.fase === 'equipe' ? fase.papel : null
  const podeEditar = papel === 'owner'

  const [form, setForm] = useState<Form>({
    whatsapp: '',
    slug: '',
    inicio: '08:00',
    fim: '18:00',
    duracao: '30',
    nomeProfissional: '',
    registroProfissional: '',
  })
  const [dias, setDias] = useState<number[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!clinica) return
    setForm({
      whatsapp: clinica.whatsapp ?? '',
      slug: clinica.slug,
      inicio: clinica.horario_padrao.inicio,
      fim: clinica.horario_padrao.fim,
      duracao: String(clinica.duracao_padrao_consulta),
      nomeProfissional: clinica.nome_profissional ?? '',
      registroProfissional: clinica.registro_profissional ?? '',
    })
    setDias(clinica.horario_padrao.dias)
  }, [clinica])

  function set<K extends keyof Form>(campo: K, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function alternarDia(valor: number) {
    setDias((atual) =>
      atual.includes(valor) ? atual.filter((d) => d !== valor) : [...atual, valor].sort((a, b) => a - b),
    )
  }

  async function salvar() {
    setErro(null)
    const invalido = validar(form, dias)
    if (invalido) {
      setErro(invalido)
      return
    }
    setSalvando(true)
    try {
      await atualizarClinica({
        whatsapp: form.whatsapp.trim() || null,
        slug: form.slug.trim().toLowerCase(),
        horarioPadrao: { dias, inicio: form.inicio, fim: form.fim },
        duracaoPadraoConsulta: Number(form.duracao),
        nomeProfissional: form.nomeProfissional.trim() || null,
        registroProfissional: form.registroProfissional.trim() || null,
      })
      await recarregarClinica()
      setAviso('Configurações salvas.')
      window.setTimeout(() => setAviso(null), 2500)
    } catch (e) {
      setErro(traduzErro(e))
    } finally {
      setSalvando(false)
    }
  }

  if (!clinica) return <p className="text-sm text-suave">Carregando…</p>

  return (
    <section>
      <h1 className="text-xl font-semibold text-texto">Configurações</h1>
      <p className="mt-1 text-sm text-suave">
        Como a clínica atende. Esses dados alimentam a agenda e o link público de agendamento.
      </p>

      {!podeEditar && (
        <p className="mt-4 rounded-lg border border-borda bg-surface p-3 text-sm text-suave">
          Somente o responsável pela clínica altera estas configurações.
        </p>
      )}

      <div className="mt-6 flex max-w-xl flex-col gap-4">
        <Campo
          label="WhatsApp da clínica"
          placeholder="5515999998888"
          hint="Usado nas confirmações de agendamento."
          value={form.whatsapp}
          onChange={(e) => set('whatsapp', e.target.value)}
          disabled={!podeEditar}
        />
        <Campo
          label="Nome da profissional"
          placeholder="Dra. Marina Souza"
          hint="Aparece na mensagem de confirmação do agendamento."
          value={form.nomeProfissional}
          onChange={(e) => set('nomeProfissional', e.target.value)}
          disabled={!podeEditar}
        />
        <Campo
          label="Registro no conselho (CRO/CRM)"
          placeholder="CRO-SP 12.345"
          hint="Acompanha o nome na mensagem de confirmação."
          value={form.registroProfissional}
          onChange={(e) => set('registroProfissional', e.target.value)}
          disabled={!podeEditar}
        />
        <Campo
          label="Link de agendamento"
          placeholder="clinica-boa"
          hint={`Link público: ${window.location.origin}/agendar/${form.slug || '…'}`}
          value={form.slug}
          onChange={(e) => set('slug', e.target.value)}
          disabled={!podeEditar}
        />

        <fieldset>
          <legend className="text-sm font-medium text-texto">Dias de funcionamento</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIAS_OPCOES.map((d) => (
              <button
                key={d.valor}
                type="button"
                aria-pressed={dias.includes(d.valor)}
                onClick={() => alternarDia(d.valor)}
                disabled={!podeEditar}
                className={`min-h-[44px] min-w-[44px] rounded-lg border px-3 text-sm transition ${
                  dias.includes(d.valor)
                    ? 'border-primaria bg-primaria/15 font-medium text-primaria-forte'
                    : 'border-borda text-suave hover:bg-surface-alta'
                }`}
              >
                {d.rotulo}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <Campo
            label="Abre às"
            type="time"
            value={form.inicio}
            onChange={(e) => set('inicio', e.target.value)}
            disabled={!podeEditar}
          />
          <Campo
            label="Fecha às"
            type="time"
            value={form.fim}
            onChange={(e) => set('fim', e.target.value)}
            disabled={!podeEditar}
          />
          <Campo
            label="Duração padrão (min)"
            type="number"
            value={form.duracao}
            onChange={(e) => set('duracao', e.target.value)}
            disabled={!podeEditar}
          />
        </div>

        {erro && (
          <p role="alert" className="text-sm text-perigo">
            {erro}
          </p>
        )}
        {aviso && (
          <p role="status" className="text-sm text-[var(--ok)]">
            {aviso}
          </p>
        )}

        <div>
          <Botao onClick={() => void salvar()} carregando={salvando} disabled={!podeEditar}>
            Salvar configurações
          </Botao>
        </div>
      </div>
    </section>
  )
}
