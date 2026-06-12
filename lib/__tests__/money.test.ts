import { describe, it, expect } from 'vitest'
import { peso } from '@/lib/money'

describe('peso', () => {
  it('formats with peso sign and grouping', () => {
    expect(peso(18000)).toBe('₱18,000')
    expect(peso(1500)).toBe('₱1,500')
    expect(peso(880)).toBe('₱880')
    expect(peso(557)).toBe('₱557')
  })
  it('rounds to whole pesos', () => {
    expect(peso(556.7)).toBe('₱557')
  })
})
