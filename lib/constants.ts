export const PEOPLE_COUNT = 12

export type PoolKind = 'fare' | 'fee'

export interface Pool {
  kind: PoolKind
  title: string
  total: number      // peso total
  share: number      // peso per person
  cta: string
}

export const POOLS: Record<PoolKind, Pool> = {
  fare: {
    kind: 'fare',
    title: 'The Boat to Neverland Fare',
    total: 18000,
    share: 18000 / PEOPLE_COUNT, // 1500
    cta: 'Pay the Fare',
  },
  fee: {
    kind: 'fee',
    title: 'This House is a Home Fee',
    total: 10560,
    share: 10560 / PEOPLE_COUNT, // 880
    cta: 'Pay the Fee',
  },
}
