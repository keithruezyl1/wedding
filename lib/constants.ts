export const PEOPLE_COUNT = 12

export type PoolKind = 'fare' | 'fee'

export interface Pool {
  kind: PoolKind
  title: string
  cta: string
  suggestion: string   // short hint shown in the upload modal
  details: string[]    // rate / schedule breakdown shown in the "where to pay" modal
}

export const POOLS: Record<PoolKind, Pool> = {
  fare: {
    kind: 'fare',
    title: 'The Boat to Neverland Fare',
    cta: 'Pay the Fare',
    suggestion: 'Economy ₱600 · Tourist ₱780 (students ₱480 / ₱624)',
    details: [
      'One way · Ferry 10:00 PM – 4:00 AM',
      'Economy: ₱600 (₱480 students)',
      'Tourist / aircon: ₱780 (₱624 students)',
    ],
  },
  fee: {
    kind: 'fee',
    title: 'This House is a Home Fee',
    cta: 'Pay the Fee',
    suggestion: '₱557 for 2 nights · ₱278 for 1 night',
    details: [
      '₱6,400 total',
      '1 night · ₱278 (1 person)',
      '2 nights · ₱557 each (11 people)',
    ],
  },
}
