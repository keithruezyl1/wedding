'use client'
import { useEffect } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { Pool } from '@/lib/constants'
import { peso } from '@/lib/money'
import { Payer } from '@/lib/payments'

const EASE = [0.22, 1, 0.36, 1] as const
// Alternating warm shades so each contribution segment is distinguishable.
const SEGMENT_SHADES = ['#E8A14B', '#E07A5F', '#D98A4F', '#CF7A64', '#B07A4F', '#9C6B5E']

// Animated pooled total that counts up to the current amount.
function PooledTotal({ total }: { total: number }) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => peso(v))

  useEffect(() => {
    if (reduce) { mv.set(total); return }
    const controls = animate(mv, total, { duration: 1.0, ease: EASE })
    return () => controls.stop()
  }, [total, reduce, mv])

  return <motion.span className="font-serif text-4xl sm:text-5xl text-charcoal tabular-nums">{text}</motion.span>
}

// A 100%-composition strip: each contribution is a segment sized by its share of
// the pool. Not a progress bar — there is no target; it visualizes what's pooled.
function CompositionStrip({ payers, total }: { payers: Payer[]; total: number }) {
  if (total <= 0) return <div className="h-2.5 w-full rounded-full bg-sand/40" />
  return (
    <div className="flex h-2.5 w-full gap-px overflow-hidden rounded-full">
      {payers.map((p, i) => (
        <div key={p.id}
          title={`${p.display_name}: ${peso(p.amount)}`}
          style={{ width: `${(p.amount / total) * 100}%`, backgroundColor: SEGMENT_SHADES[i % SEGMENT_SHADES.length] }} />
      ))}
    </div>
  )
}

export default function ExpenseColumn({
  pool, payers, onPay, onSelectPayer,
}: {
  pool: Pool
  payers: Payer[]
  onPay: () => void
  onSelectPayer: (p: Payer) => void
}) {
  const total = payers.reduce((sum, p) => sum + p.amount, 0)
  const n = payers.length

  return (
    <section className="flex-1 rounded-3xl bg-ivory/80 ring-1 ring-sand/60 p-7 shadow-sm">
      <h2 className="font-serif text-3xl text-charcoal text-center">{pool.title}</h2>

      <div className="mt-4 mb-3 text-center">
        <PooledTotal total={total} />
        <p className="mt-1 text-sm text-charcoal/50">
          {n === 0 ? 'pooled so far' : `pooled · ${n} ${n === 1 ? 'contribution' : 'contributions'}`}
        </p>
      </div>

      <CompositionStrip payers={payers} total={total} />

      <div className="mt-6 text-center">
        <button onClick={onPay}
          className="rounded-full bg-amber px-8 py-3 font-medium text-charcoal hover:bg-coral transition-colors duration-300">
          {pool.cta}
        </button>
      </div>

      <ul className="mt-7 space-y-1.5">
        {payers.map((p) => (
          <li key={p.id}>
            <button onClick={() => onSelectPayer(p)}
              className="group w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-charcoal/80 hover:bg-cream hover:text-charcoal transition-colors">
              <span className="truncate">{p.display_name}</span>
              <span className="flex shrink-0 items-center gap-2.5 text-sm">
                <span className="font-medium text-charcoal/80 tabular-nums">{peso(p.amount)}</span>
                <span className="text-charcoal/35 group-hover:text-coral transition-colors" aria-label="View proof">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </span>
              </span>
            </button>
          </li>
        ))}
        {payers.length === 0 && <li className="text-center text-charcoal/40 text-sm py-2">No one yet — be the first.</li>}
      </ul>
    </section>
  )
}
