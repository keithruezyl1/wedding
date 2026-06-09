'use client'
import { useCallback, useEffect, useState } from 'react'
import { Account } from '@/lib/account'
import { POOLS, Pool } from '@/lib/constants'
import { fetchPayers, Payer } from '@/lib/payments'
import ExpenseColumn from '@/components/ExpenseColumn'
import PaymentModal from '@/components/PaymentModal'
import SuccessModal from '@/components/SuccessModal'
import ProofModal from '@/components/ProofModal'

export default function Dashboard({ account, onReplay }: { account: Account; onReplay: () => void }) {
  const [fare, setFare] = useState<Payer[]>([])
  const [fee, setFee] = useState<Payer[]>([])
  const [payPool, setPayPool] = useState<Pool | null>(null)
  const [selected, setSelected] = useState<Payer | null>(null)
  const [success, setSuccess] = useState(false)

  const load = useCallback(async () => {
    const [f1, f2] = await Promise.all([fetchPayers('fare'), fetchPayers('fee')])
    setFare(f1); setFee(f2)
  }, [])

  useEffect(() => { load() }, [load])

  const paidFare = fare.some((p) => p.account_id === account.id)
  const paidFee = fee.some((p) => p.account_id === account.id)

  return (
    <div className="min-h-screen px-4 sm:px-8 py-12 animate-fade-in">
      <header className="text-center mb-10">
        <p className="font-serif tracking-[0.3em] uppercase text-charcoal/50 text-sm">Ormoc · 2026</p>
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mt-1">Huey &amp; Cherry</h1>
        <p className="text-charcoal/55 mt-2">Welcome, {account.display_name}.</p>
      </header>

      <div className="mx-auto max-w-5xl flex flex-col md:flex-row gap-6">
        <ExpenseColumn pool={POOLS.fare} payers={fare} hasPaid={paidFare}
          onPay={() => setPayPool(POOLS.fare)} onSelectPayer={setSelected} />
        <ExpenseColumn pool={POOLS.fee} payers={fee} hasPaid={paidFee}
          onPay={() => setPayPool(POOLS.fee)} onSelectPayer={setSelected} />
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
      <ProofModal payer={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
