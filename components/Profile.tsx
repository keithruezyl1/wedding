'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Account, updateAvatar } from '@/lib/account'
import { POOLS } from '@/lib/constants'
import { fetchMyContributions, deletePayment, Payer } from '@/lib/payments'
import { peso } from '@/lib/money'
import LetterAvatar from '@/components/LetterAvatar'
import ProofModal, { ProofSelection } from '@/components/ProofModal'

function shortDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

export default function Profile({
  account, onBack, onAccountChange,
}: {
  account: Account
  onBack: () => void
  onAccountChange: (a: Account) => void
}) {
  const [fare, setFare] = useState<Payer[]>([])
  const [fee, setFee] = useState<Payer[]>([])
  const [selected, setSelected] = useState<ProofSelection | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const load = useCallback(async () => {
    const c = await fetchMyContributions(account.id)
    setFare(c.fare); setFee(c.fee)
  }, [account.id])

  useEffect(() => { load() }, [load])

  async function onPickAvatar(file: File | null) {
    if (!file) return
    setUploading(true)
    try {
      const url = await updateAvatar(account.id, file)
      onAccountChange({ ...account, avatar_url: url })
    } catch { /* ignore */ } finally {
      setUploading(false)
    }
  }

  async function handleDelete(payer: Payer) {
    await deletePayment(payer)
    await load()
  }

  const sections = [
    { pool: POOLS.fare, rows: fare },
    { pool: POOLS.fee, rows: fee },
  ]

  return (
    <div className="min-h-screen px-4 sm:px-8 py-12 animate-fade-in">
      <div className="mx-auto max-w-2xl">
        <button onClick={onBack}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-charcoal/50 hover:text-charcoal transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>

        <div className="text-center">
          <button onClick={() => fileRef.current?.click()} aria-label="Change profile photo"
            className="group relative mx-auto block rounded-full">
            <LetterAvatar name={account.display_name} avatarUrl={account.avatar_url} size={112}
              className="ring-2 ring-sand shadow-sm" />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-charcoal/45 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)} />
          <p className="mt-2 text-xs text-charcoal/40">{uploading ? 'Uploading…' : 'Tap photo to change'}</p>
          <h1 className="mt-3 font-serif text-4xl text-charcoal">{account.display_name}</h1>
        </div>

        <div className="mt-10 space-y-6">
          {sections.map(({ pool, rows }) => {
            const total = rows.reduce((s, p) => s + p.amount, 0)
            return (
              <section key={pool.kind} className="rounded-3xl bg-ivory/80 ring-1 ring-sand/60 p-6 shadow-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-serif text-2xl text-charcoal">{pool.title}</h2>
                  <span className="shrink-0 font-medium text-coral tabular-nums">{peso(total)}</span>
                </div>
                <ul className="mt-4 space-y-1.5">
                  {rows.map((r) => (
                    <li key={r.id}>
                      <button onClick={() => setSelected({ payer: r })}
                        className="group w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-charcoal/80 hover:bg-cream transition-colors">
                        <span className="font-medium tabular-nums">{peso(r.amount)}</span>
                        <span className="flex items-center gap-2.5 text-sm text-charcoal/45">
                          <span>{shortDate(r.created_at)}</span>
                          <span className="text-charcoal/35 group-hover:text-coral transition-colors" aria-label="View proof">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                  {rows.length === 0 && (
                    <li className="py-2 text-center text-sm text-charcoal/40">No contributions yet.</li>
                  )}
                </ul>
              </section>
            )
          })}
        </div>
      </div>

      <ProofModal selection={selected} currentAccountId={account.id}
        onClose={() => setSelected(null)} onDelete={handleDelete} />
    </div>
  )
}
