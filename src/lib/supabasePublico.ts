import { createClient } from '@supabase/supabase-js'

/** Client ANÔNIMO das páginas públicas (agendamento online): nunca guarda sessão. */
export const supabasePublico = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { db: { schema: 'dentia' }, auth: { persistSession: false } },
)
