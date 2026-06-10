import { supabase } from '@/lib/supabaseClient'

export function normalizeName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}

export interface Account {
  id: string
  name: string
  display_name: string
  avatar_url: string | null
}

const ACCOUNT_COLS = 'id, name, display_name, avatar_url'

// Creates the account if the normalized name is new; otherwise returns the existing one.
export async function createOrLoadAccount(rawName: string): Promise<Account> {
  const name = normalizeName(rawName)
  if (!name) throw new Error('Please enter a name.')

  const { data: existing, error: selErr } = await supabase
    .from('accounts')
    .select(ACCOUNT_COLS)
    .eq('name', name)
    .maybeSingle()
  if (selErr) throw selErr
  if (existing) return existing as Account

  const { data: created, error: insErr } = await supabase
    .from('accounts')
    .insert({ name, display_name: rawName.trim() })
    .select(ACCOUNT_COLS)
    .single()
  if (insErr) {
    // race: another insert won; re-fetch
    const { data: again } = await supabase
      .from('accounts').select(ACCOUNT_COLS).eq('name', name).single()
    if (again) return again as Account
    throw insErr
  }
  return created as Account
}

// Upload a new avatar image (stable per-account path) and save its URL. Returns
// the cache-busted public URL.
export async function updateAvatar(accountId: string, file: File): Promise<string> {
  const up = await supabase.storage
    .from('avatars')
    .upload(accountId, file, { upsert: true, contentType: file.type || 'image/jpeg' })
  if (up.error) throw up.error

  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(accountId)
  const url = `${pub.publicUrl}?t=${Date.now()}`

  const { error } = await supabase.from('accounts').update({ avatar_url: url }).eq('id', accountId)
  if (error) throw error
  return url
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
