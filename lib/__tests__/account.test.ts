import { describe, it, expect } from 'vitest'
import { normalizeName } from '@/lib/account'

describe('normalizeName', () => {
  it('trims and lowercases', () => {
    expect(normalizeName('  Keith  ')).toBe('keith')
  })
  it('collapses internal whitespace', () => {
    expect(normalizeName('Mary   Jane')).toBe('mary jane')
  })
})
