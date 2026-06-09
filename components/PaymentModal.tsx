'use client'
import { useState } from 'react'
import Modal from '@/components/Modal'
import { Pool } from '@/lib/constants'
import { peso } from '@/lib/money'
import { submitPayment } from '@/lib/payments'

export default function PaymentModal({
  open, pool, accountId, onClose, onSuccess,
}: {
  open: boolean
  pool: Pool | null
  accountId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const amountNum = parseFloat(amount)
  const amountValid = Number.isFinite(amountNum) && amountNum > 0

  function pick(f: File | null) {
    setFile(f); setErr('')
    setPreview(f ? URL.createObjectURL(f) : '')
  }
  function reset() { setFile(null); setPreview(''); setAmount(''); setConfirmed(false); setErr(''); setBusy(false) }

  async function upload() {
    if (!file || !confirmed || !pool || !amountValid) return
    setBusy(true); setErr('')
    try {
      await submitPayment(accountId, pool.kind, file, amountNum)
      reset(); onSuccess()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e.message ?? 'Upload failed. Please try again.')
      setBusy(false)
    }
  }

  return (
    <Modal open={open && !!pool} onClose={() => { reset(); onClose() }} labelledBy="pay-title">
      {pool && (
        <div>
          <h3 id="pay-title" className="font-serif text-2xl text-charcoal">{pool.title}</h3>
          <p className="text-charcoal/60 mt-1 mb-5">
            Enter how much you sent and attach a photo of your proof. You can contribute as many times as you like.
          </p>

          <div className="text-left mb-4">
            <label htmlFor="amount" className="block text-sm text-charcoal/70 mb-1">How much did you send?</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/50">₱</span>
              <input id="amount" type="number" inputMode="decimal" min="0" step="0.01"
                value={amount} onChange={(e) => { setAmount(e.target.value); setErr('') }}
                placeholder="0.00"
                className="w-full rounded-xl bg-white pl-8 pr-4 py-3 ring-1 ring-sand focus:ring-2 focus:ring-amber outline-none tabular-nums" />
            </div>
            <p className="text-xs text-charcoal/45 mt-1">Suggested share: {peso(pool.share)}</p>
          </div>

          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-sand hover:border-amber transition-colors p-4 text-center">
            {preview
              ? /* eslint-disable-next-line @next/next/no-img-element */
                <img src={preview} alt="Preview" className="mx-auto max-h-52 rounded-lg object-contain" />
              : <span className="text-charcoal/50">Tap to choose an image</span>}
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          </label>

          <label className="mt-5 flex items-start gap-3 text-sm text-charcoal/80 cursor-pointer">
            <span className="relative mt-0.5 inline-block h-5 w-5 shrink-0">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
                className="peer absolute inset-0 z-0 h-full w-full cursor-pointer appearance-none rounded-md border border-sand bg-white transition-colors checked:border-amber checked:bg-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/50" />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"
                className="pointer-events-none absolute inset-0 z-10 m-auto h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span>I confirm I have paid and uploaded the correct proof.</span>
          </label>

          {err && <p className="mt-3 text-coral text-sm">{err}</p>}

          <div className="mt-6 flex gap-3 justify-end">
            <button onClick={() => { reset(); onClose() }}
              className="rounded-full px-5 py-2.5 text-charcoal/70 hover:text-charcoal">Cancel</button>
            <button onClick={upload} disabled={!file || !confirmed || !amountValid || busy}
              className="rounded-full bg-amber px-7 py-2.5 text-charcoal hover:bg-coral transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
              {busy ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
