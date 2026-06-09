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
  it('computes amount, fraction, and label from the total contributed', () => {
    const p = poolProgress(POOLS.fare, 7500)
    expect(p.amount).toBe(7500)
    expect(p.fraction).toBeCloseTo(7500 / 18000)
    expect(p.label).toBe('₱7,500 of ₱18,000')
  })
  it('clamps the fraction to 1 when the goal is exceeded', () => {
    expect(poolProgress(POOLS.fee, 20000).fraction).toBe(1)
  })
  it('is zero at no contributions', () => {
    expect(poolProgress(POOLS.fare, 0).fraction).toBe(0)
  })
})
