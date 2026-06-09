'use client'
import { useState } from 'react'
import Image from 'next/image'

export default function Gate({ onPass }: { onPass: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(false)
    const res = await fetch('/api/gate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    setBusy(false)
    if (res.ok) onPass()
    else { setErr(true); setPw('') }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <Image src="/img/last.jpg" alt="" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-charcoal/55" />
      <form onSubmit={submit} className={`relative z-10 text-center px-6 ${err ? 'animate-shake' : ''}`}>
        <p className="font-serif text-ivory/80 tracking-[0.3em] uppercase text-sm mb-3">Ormoc · 2026</p>
        <h1 className="font-serif text-ivory text-5xl sm:text-6xl mb-8">Huey &amp; Cherry</h1>
        <input
          type="password" value={pw} onChange={(e) => setPw(e.target.value)}
          placeholder="Enter the password" autoFocus
          className="w-72 max-w-full text-center rounded-full bg-ivory/95 px-5 py-3 outline-none ring-2 ring-transparent focus:ring-amber"
        />
        <div className="h-6 mt-3 text-coral/90 text-sm">{err ? "That's not quite it." : ''}</div>
        <button disabled={busy}
          className="mt-2 rounded-full bg-amber px-8 py-3 font-medium text-charcoal hover:bg-coral transition-colors duration-300 disabled:opacity-60">
          {busy ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
