'use client'
import { useEffect, useState } from 'react'
import Gate from '@/components/Gate'
import NameEntry from '@/components/NameEntry'
import Onboarding from '@/components/Onboarding'
import Dashboard from '@/components/Dashboard'
import Profile from '@/components/Profile'
import { Account, accountExists } from '@/lib/account'

type Phase = 'gate' | 'name' | 'onboarding' | 'dashboard' | 'profile'
const LS_ACCOUNT = 'wedding.account'
const LS_ONBOARDED = 'wedding.onboarded'

export default function Page() {
  const [phase, setPhase] = useState<Phase>('gate')
  const [account, setAccount] = useState<Account | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function restore() {
      try {
        const raw = localStorage.getItem(LS_ACCOUNT)
        if (raw) {
          const acc: Account = JSON.parse(raw)
          // Revalidate against the DB: if the account was removed (e.g. a data
          // reset), drop the stale session and send them back to the gate.
          const exists = await accountExists(acc.id)
          if (cancelled) return
          if (exists) {
            setAccount(acc)
            setPhase('dashboard')
          } else {
            localStorage.removeItem(LS_ACCOUNT)
            setPhase('gate')
          }
        }
      } catch { /* ignore */ }
      if (!cancelled) setReady(true)
    }
    restore()
    return () => { cancelled = true }
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
    return (
      <Dashboard account={account}
        onReplay={() => setPhase('onboarding')}
        onOpenProfile={() => setPhase('profile')} />
    )

  if (phase === 'profile' && account)
    return (
      <Profile account={account}
        onBack={() => setPhase('dashboard')}
        onAccountChange={(a) => {
          setAccount(a)
          localStorage.setItem(LS_ACCOUNT, JSON.stringify(a))
        }} />
    )

  return <Gate onPass={() => setPhase('name')} />
}
