'use client'
import { useState } from 'react'
import { createOrLoadAccount, Account } from '@/lib/account'

export default function NameEntry({ onAccount }: { onAccount: (a: Account, isNew: boolean) => void }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true); setErr('')
    try {
      const acc = await createOrLoadAccount(name)
      onAccount(acc, true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e.message ?? 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 animate-fade-in">
      <form onSubmit={submit} className="text-center w-full max-w-sm">
        <h2 className="font-serif text-4xl text-charcoal mb-2">What shall we call you?</h2>
        <p className="text-charcoal/60 mb-8">So we know who is joining the celebration.</p>
        <input
          value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Your name"
          className="w-full text-center rounded-full bg-white px-5 py-3 ring-1 ring-sand focus:ring-2 focus:ring-amber outline-none"
        />
        <div className="h-6 mt-3 text-coral text-sm">{err}</div>
        <button disabled={busy}
          className="mt-2 rounded-full bg-amber px-8 py-3 font-medium text-charcoal hover:bg-coral transition-colors duration-300 disabled:opacity-60">
          {busy ? 'Just a moment…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
