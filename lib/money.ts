import { PEOPLE_COUNT, Pool } from '@/lib/constants'

export function peso(amount: number): string {
  return '₱' + Math.round(amount).toLocaleString('en-PH')
}

export interface Progress {
  paidCount: number
  paidAmount: number
  fraction: number
  label: string
}

export function poolProgress(pool: Pool, paidCount: number): Progress {
  const clamped = Math.max(0, Math.min(PEOPLE_COUNT, paidCount))
  const paidAmount = clamped * pool.share
  const fraction = clamped / PEOPLE_COUNT
  const label = `${peso(paidAmount)} / ${peso(pool.total)} · ${clamped} of ${PEOPLE_COUNT} paid`
  return { paidCount: clamped, paidAmount, fraction, label }
}
