# IA.Dent

Gestão odontológica simples: pacientes, agenda e agendamento online — do lead ao atendimento.

## O que tem

- **CRM de pacientes** — cadastro, busca, timeline de interações e tarefas, conversão de lead
- **Serviços** — catálogo com duração e preço (centavos, zero float)
- **Agenda** — dia/semana por profissional, anti-conflito no banco (constraint EXCLUDE), bloqueios
- **Agendamento online** — link público (`/agendar/<slug>`) com funil de 3 passos, sem login
- **Portal do paciente** — conta própria, consulta só o que é dele
- **Multi-tenant** — cada clínica vê só os próprios dados (RLS no banco, provada por probe)

## Stack

React 19 + Vite + TypeScript strict + Tailwind v4 + supabase-js + React Hook Form + Zod.
Estado: React Context para sessão, hooks + services para o resto — sem lib de estado global.

## Rodando local

```bash
npm install
cp .env.example .env.local   # preencha as variáveis do Supabase
npm run dev
```

## Variáveis de ambiente

| Variável | Onde achar |
|---|---|
| `SUPABASE_URL` | Settings → API do projeto Supabase |
| `SUPABASE_ANON_KEY` | Settings → API → publishable key |

## Deploy na Vercel

1. [vercel.com/new](https://vercel.com/new) → importe o repo `cwappsia/IA.Dent` (framework Vite é detectado sozinho)
2. Em **Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | `https://ysjtycgahiuyfdcseskg.supabase.co` |
| `SUPABASE_ANON_KEY` | a publishable key do projeto (Supabase → Settings → API — a mesma do `.env.local`) |

3. Deploy. Push na `main` publica sozinho daí em diante.

## Banco

Migrations versionadas em `supabase/migrations` (schema `dentia`, 1 migration = 1 transação).

## Gates

`npm run typecheck` · `npm test` · `npm run build`

---

© CW IA Apps — [cwiaapps.tech](https://cwiaapps.tech)
