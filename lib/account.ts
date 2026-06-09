import { supabase } from '@/lib/supabaseClient'

export function normalizeName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}

export interface Account {
  id: string
  name: string
  display_name: string
}

// Creates the account if the normalized name is new; otherwise returns the existing one.
export async function createOrLoadAccount(rawName: string): Promise<Account> {
  const name = normalizeName(rawName)
  if (!name) throw new Error('Please enter a name.')

  const { data: existing, error: selErr } = await supabase
    .from('accounts')
    .select('id, name, display_name')
    .eq('name', name)
    .maybeSingle()
  if (selErr) throw selErr
  if (existing) return existing as Account

  const { data: created, error: insErr } = await supabase
    .from('accounts')
    .insert({ name, display_name: rawName.trim() })
    .select('id, name, display_name')
    .single()
  if (insErr) {
    // race: another insert won; re-fetch
    const { data: again } = await supabase
      .from('accounts').select('id, name, display_name').eq('name', name).single()
    if (again) return again as Account
    throw insErr
  }
  return created as Account
}

// Whether a stored account id still exists in the DB. Fails open (returns true)
// on network/db error so we never log someone out spuriously.
export async function accountExists(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', id)
    .maybeSingle()
  if (error) return true
  return !!data
}
