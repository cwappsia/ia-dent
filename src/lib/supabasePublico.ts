import { createClient } from '@supabase/supabase-js'

/** Client ANÔNIMO das páginas públicas (agendamento online): nunca guarda sessão. */
export const supabasePublico = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_ANON_KEY,
  { db: { schema: 'dentia' }, auth: { persistSession: false } },
)
