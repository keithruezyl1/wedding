import { supabase } from '@/lib/supabaseClient'
import { PoolKind } from '@/lib/constants'

export interface Payer {
  account_id: string
  display_name: string
  proof_url: string
}

// All payments for a kind, joined to the payer's display name.
export async function fetchPayers(kind: PoolKind): Promise<Payer[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('account_id, proof_url, accounts(display_name)')
    .eq('kind', kind)
    .order('created_at', { ascending: true })
  if (error) throw error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    account_id: r.account_id,
    proof_url: r.proof_url,
    display_name: r.accounts?.display_name ?? 'Someone',
  }))
}

// Upload proof image to Storage and upsert the payment row. Returns public URL.
export async function submitPayment(
  accountId: string,
  kind: PoolKind,
  file: File,
): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${accountId}/${kind}.${ext}`

  const up = await supabase.storage
    .from('proofs')
    .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' })
  if (up.error) throw up.error

  const { data: pub } = supabase.storage.from('proofs').getPublicUrl(path)
  const proof_url = pub.publicUrl

  const { error } = await supabase
    .from('payments')
    .upsert({ account_id: accountId, kind, proof_url }, { onConflict: 'account_id,kind' })
  if (error) throw error

  return proof_url
}
