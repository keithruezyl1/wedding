'use client'
import { Pool } from '@/lib/constants'
import { poolProgress } from '@/lib/money'
import { Payer } from '@/lib/payments'
import ProgressBar from '@/components/ProgressBar'

export default function ExpenseColumn({
  pool, payers, hasPaid, onPay, onSelectPayer,
}: {
  pool: Pool
  payers: Payer[]
  hasPaid: boolean
  onPay: () => void
  onSelectPayer: (p: Payer) => void
}) {
  const prog = poolProgress(pool, payers.length)
  return (
    <section className="flex-1 rounded-3xl bg-ivory/80 ring-1 ring-sand/60 p-7 shadow-sm">
      <h2 className="font-serif text-3xl text-charcoal text-center">{pool.title}</h2>
      <p className="text-center text-charcoal/55 mt-1 mb-5">{prog.label}</p>
      <ProgressBar fraction={prog.fraction} />

      <div className="mt-6 text-center">
        <button onClick={onPay} disabled={hasPaid}
          className="rounded-full bg-amber px-8 py-3 font-medium text-charcoal hover:bg-coral transition-colors duration-300 disabled:opacity-50 disabled:cursor-default">
          {hasPaid ? 'Paid ✓' : pool.cta}
        </button>
      </div>

      <ul className="mt-7 space-y-1.5">
        {payers.map((p) => (
          <li key={p.account_id}>
            <button onClick={() => onSelectPayer(p)}
              className="w-full text-left rounded-lg px-3 py-2 text-charcoal/80 hover:bg-cream hover:text-charcoal transition-colors">
              {p.display_name}
            </button>
          </li>
        ))}
        {payers.length === 0 && <li className="text-center text-charcoal/40 text-sm py-2">No one yet — be the first.</li>}
      </ul>
    </section>
  )
}
