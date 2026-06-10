'use client'
import { useCallback, useEffect, useState } from 'react'
import { Account } from '@/lib/account'
import { POOLS, Pool } from '@/lib/constants'
import { fetchPayers, deletePayment, Payer } from '@/lib/payments'
import ExpenseColumn from '@/components/ExpenseColumn'
import PaymentModal from '@/components/PaymentModal'
import SuccessModal from '@/components/SuccessModal'
import ProofModal, { ProofSelection } from '@/components/ProofModal'
import SendMoneyModal from '@/components/SendMoneyModal'
import LogoSlideshow from '@/components/LogoSlideshow'
import LetterAvatar from '@/components/LetterAvatar'

export default function Dashboard({ account, onReplay, onOpenProfile }: {
  account: Account
  onReplay: () => void
  onOpenProfile: () => void
}) {
  const [fare, setFare] = useState<Payer[]>([])
  const [fee, setFee] = useState<Payer[]>([])
  const [payPool, setPayPool] = useState<Pool | null>(null)
  const [selected, setSelected] = useState<ProofSelection | null>(null)
  const [success, setSuccess] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)

  const load = useCallback(async () => {
    const [f1, f2] = await Promise.all([fetchPayers('fare'), fetchPayers('fee')])
    setFare(f1); setFee(f2)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(payer: Payer) {
    await deletePayment(payer)
    await load()
  }

  return (
    <div className="relative min-h-screen px-4 sm:px-8 py-12 animate-fade-in">
      <button onClick={onOpenProfile} aria-label="Open your profile"
        className="absolute right-4 top-5 sm:right-8 z-10 rounded-full ring-2 ring-transparent hover:ring-amber/60 transition-shadow">
        <LetterAvatar name={account.display_name} avatarUrl={account.avatar_url} size={44}
          className="ring-1 ring-sand shadow-sm" />
      </button>

      <header className="text-center mb-10">
        <LogoSlideshow className="mx-auto mb-4 h-20 w-20" />
        <p className="font-serif tracking-[0.3em] uppercase text-charcoal/50 text-sm">Ormoc · 2026</p>
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mt-1">Huey &amp; Cherry</h1>
        <p className="text-charcoal/55 mt-2">Welcome, {account.display_name}.</p>

        <button onClick={() => setSendOpen(true)}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber/60 text-charcoal/80 px-6 py-2.5 hover:bg-amber hover:text-charcoal transition-colors duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3.75 3.75h6v6h-6v-6zm10.5 0h6v6h-6v-6zm-10.5 10.5h6v6h-6v-6zm10.5 3h3m-3 3h6m0-6v.01" />
          </svg>
          Where to send money
        </button>
      </header>

      <div className="mx-auto max-w-5xl flex flex-col md:flex-row gap-6">
        <ExpenseColumn pool={POOLS.fare} payers={fare}
          onPay={() => setPayPool(POOLS.fare)} onSelectPayer={(p) => setSelected({ payer: p })} />
        <ExpenseColumn pool={POOLS.fee} payers={fee}
          onPay={() => setPayPool(POOLS.fee)} onSelectPayer={(p) => setSelected({ payer: p })} />
      </div>

      <div className="text-center mt-10">
        <button onClick={onReplay} className="text-charcoal/40 hover:text-charcoal/70 text-sm underline underline-offset-4">
          replay intro
        </button>
      </div>

      <PaymentModal open={!!payPool} pool={payPool} accountId={account.id}
        onClose={() => setPayPool(null)}
        onSuccess={async () => { setPayPool(null); await load(); setSuccess(true) }} />
      <SuccessModal open={success} name={account.display_name} onClose={() => setSuccess(false)} />
      <ProofModal selection={selected} currentAccountId={account.id}
        onClose={() => setSelected(null)} onDelete={handleDelete} />
      <SendMoneyModal open={sendOpen} onClose={() => setSendOpen(false)} />
    </div>
  )
}
