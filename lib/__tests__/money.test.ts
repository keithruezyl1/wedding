import { describe, it, expect } from 'vitest'
import { peso, poolProgress } from '@/lib/money'
import { POOLS } from '@/lib/constants'

describe('peso', () => {
  it('formats with peso sign and grouping', () => {
    expect(peso(18000)).toBe('₱18,000')
    expect(peso(1500)).toBe('₱1,500')
    expect(peso(880)).toBe('₱880')
  })
})

describe('poolProgress', () => {
  it('computes paid amount, fraction, and label from payer count', () => {
    const p = poolProgress(POOLS.fare, 5)
    expect(p.paidAmount).toBe(7500)
    expect(p.fraction).toBeCloseTo(5 / 12)
    expect(p.label).toBe('₱7,500 / ₱18,000 · 5 of 12 paid')
  })
  it('is full at 12 payers', () => {
    expect(poolProgress(POOLS.fee, 12).fraction).toBe(1)
  })
})
