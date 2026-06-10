import { supabase } from '@/lib/supabaseClient'
import { PoolKind } from '@/lib/constants'

export interface Payer {
  id: string
  account_id: string
  display_name: string
  proof_url: string
  amount: number
  created_at: string
}

// All contributions for a kind, joined to the contributor's display name.
export async function fetchPayers(kind: PoolKind): Promise<Payer[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, account_id, proof_url, amount, created_at, accounts(display_name)')
    .eq('kind', kind)
    .order('created_at', { ascending: true })
  if (error) throw error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: r.id,
    account_id: r.account_id,
    proof_url: r.proof_url,
    amount: Number(r.amount) || 0,
    created_at: r.created_at,
    display_name: r.accounts?.display_name ?? 'Someone',
  }))
}

// One account's contributions, split by pool kind (for the profile screen).
export async function fetchMyContributions(accountId: string): Promise<{ fare: Payer[]; fee: Payer[] }> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, account_id, proof_url, amount, created_at, kind, accounts(display_name)')
    .eq('account_id', accountId)
    .order('created_at', { ascending: true })
  if (error) throw error
  const out: { fare: Payer[]; fee: Payer[] } = { fare: [], fee: [] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (data ?? []) as any[]) {
    const row: Payer = {
      id: r.id,
      account_id: r.account_id,
      proof_url: r.proof_url,
      amount: Number(r.amount) || 0,
      created_at: r.created_at,
      display_name: r.accounts?.display_name ?? 'Someone',
    }
    if (r.kind === 'fare') out.fare.push(row)
    else if (r.kind === 'fee') out.fee.push(row)
  }
  return out
}

// Upload proof to a unique path and insert a new contribution row. Returns its id.
export async function submitPayment(
  accountId: string,
  kind: PoolKind,
  file: File,
  amount: number,
): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${accountId}/${kind}/${crypto.randomUUID()}.${ext}`

  const up = await supabase.storage
    .from('proofs')
    .upload(path, file, { contentType: file.type || 'image/jpeg' })
  if (up.error) throw up.error

  const { data: pub } = supabase.storage.from('proofs').getPublicUrl(path)
  const proof_url = pub.publicUrl

  const { data, error } = await supabase
    .from('payments')
    .insert({ account_id: accountId, kind, proof_url, amount })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

// Remove a single contribution and its proof image (best-effort on the file).
export async function deletePayment(payment: { id: string; proof_url: string }): Promise<void> {
  const marker = '/proofs/'
  const i = payment.proof_url.indexOf(marker)
  if (i >= 0) {
    const path = decodeURIComponent(payment.proof_url.slice(i + marker.length))
    await supabase.storage.from('proofs').remove([path]).catch(() => { /* ignore missing */ })
  }
  const { error } = await supabase.from('payments').delete().eq('id', payment.id)
  if (error) throw error
}
