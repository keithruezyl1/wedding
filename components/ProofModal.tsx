'use client'
import { useState } from 'react'
import Modal from '@/components/Modal'
import { Payer } from '@/lib/payments'
import { peso } from '@/lib/money'

export interface ProofSelection {
  payer: Payer
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function ProofModal({
  selection, currentAccountId, onClose, onDelete,
}: {
  selection: ProofSelection | null
  currentAccountId: string
  onClose: () => void
  onDelete: (payer: Payer) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const payer = selection?.payer
  const canDelete = !!payer && payer.account_id === currentAccountId

  function close() { setConfirming(false); setBusy(false); onClose() }

  async function remove() {
    if (!payer) return
    setBusy(true)
    try {
      await onDelete(payer)
      close()
    } catch {
      setBusy(false)
    }
  }

  return (
    <Modal open={!!selection} onClose={close} labelledBy="proof-title">
      {payer && (
        <div className="relative text-center">
          <button onClick={close} aria-label="Close"
            className="absolute -top-1 -right-1 rounded-full p-1.5 text-charcoal/40 hover:text-charcoal hover:bg-cream transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <h3 id="proof-title" className="font-serif text-2xl text-charcoal">{payer.display_name}</h3>
          <p className="text-coral font-medium tabular-nums">{peso(payer.amount)}</p>
          <p className="text-charcoal/45 text-xs mb-4">{formatTimestamp(payer.created_at)}</p>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={payer.proof_url} alt={`Proof from ${payer.display_name}`}
               className="w-full rounded-xl ring-1 ring-sand object-contain max-h-[60vh]" />

          {confirming ? (
            <div className="mt-6">
              <p className="text-charcoal/70 text-sm mb-3">Remove this contribution? It will be subtracted from the total.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={remove} disabled={busy}
                  className="rounded-full bg-ruin px-6 py-2.5 text-white hover:bg-ruin/85 transition-colors duration-300 disabled:opacity-60">
                  {busy ? 'Removing…' : 'Yes, remove'}
                </button>
                <button onClick={() => setConfirming(false)} disabled={busy}
                  className="rounded-full px-5 py-2.5 text-charcoal/70 hover:text-charcoal transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            canDelete && (
              <div className="mt-6">
                <button onClick={() => setConfirming(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-ruin px-7 py-2.5 text-white hover:bg-ruin/85 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Delete proof
                </button>
              </div>
            )
          )}
        </div>
      )}
    </Modal>
  )
}
