'use client'
import { useEffect, useState } from 'react'
import Gate from '@/components/Gate'
import NameEntry from '@/components/NameEntry'
import Onboarding from '@/components/Onboarding'
import Dashboard from '@/components/Dashboard'
import { Account } from '@/lib/account'

type Phase = 'gate' | 'name' | 'onboarding' | 'dashboard'
const LS_ACCOUNT = 'wedding.account'
const LS_ONBOARDED = 'wedding.onboarded'

export default function Page() {
  const [phase, setPhase] = useState<Phase>('gate')
  const [account, setAccount] = useState<Account | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_ACCOUNT)
      if (raw) { setAccount(JSON.parse(raw)); setPhase('dashboard') }
    } catch { /* ignore */ }
    setReady(true)
  }, [])

  if (!ready) return null

  if (phase === 'gate') return <Gate onPass={() => setPhase('name')} />

  if (phase === 'name')
    return (
      <NameEntry onAccount={(a) => {
        setAccount(a)
        localStorage.setItem(LS_ACCOUNT, JSON.stringify(a))
        const seen = localStorage.getItem(LS_ONBOARDED)
        setPhase(seen ? 'dashboard' : 'onboarding')
      }} />
    )

  if (phase === 'onboarding' && account)
    return <Onboarding name={account.display_name} onDone={() => {
      localStorage.setItem(LS_ONBOARDED, '1')
      setPhase('dashboard')
    }} />

  if (phase === 'dashboard' && account)
    return <Dashboard account={account} onReplay={() => setPhase('onboarding')} />

  return <Gate onPass={() => setPhase('name')} />
}
