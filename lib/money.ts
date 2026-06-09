import { Pool } from '@/lib/constants'

export function peso(amount: number): string {
  return '₱' + Math.round(amount).toLocaleString('en-PH')
}

export interface Progress {
  amount: number
  fraction: number
  label: string
}

// Progress is driven by the total pesos contributed toward a pool's goal.
export function poolProgress(pool: Pool, totalAmount: number): Progress {
  const amount = Math.max(0, totalAmount)
  const fraction = pool.total > 0 ? Math.min(1, amount / pool.total) : 0
  const label = `${peso(amount)} of ${peso(pool.total)}`
  return { amount, fraction, label }
}
