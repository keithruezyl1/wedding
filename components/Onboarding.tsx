'use client'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import confetti from 'canvas-confetti'

type Step = 1 | 2 | 3
const EASE = [0.22, 1, 0.36, 1] as const

export default function Onboarding({ name, onDone }: { name: string; onDone: () => void }) {
  const [step, setStep] = useState<Step>(1)
  const [sub, setSub] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (step !== 1) return
    const t1 = setTimeout(() => setSub(1), 2600)
    const t2 = setTimeout(() => setStep(2), 5600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [step])

  useEffect(() => {
    if (step !== 2) return
    const fire = () => confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 },
      colors: ['#E8A14B', '#E07A5F', '#FBF6EE', '#E7D3B8'] })
    fire(); const burst = setTimeout(fire, 700)
    const t = setTimeout(() => setStep(3), 5200)
    return () => { clearTimeout(burst); clearTimeout(t) }
  }, [step])

  useEffect(() => {
    if (step !== 3) return
    audioRef.current?.play().catch(() => {})
  }, [step])

  const fade = {
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: reduce ? { opacity: 0 } : { opacity: 0, y: -14 },
    transition: { duration: 0.9, ease: EASE },
  }

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center text-center px-6"
      animate={{ backgroundColor: step === 3 ? '#000000' : '#F6EFE3' }}
      transition={{ duration: 1.0, ease: EASE }}
    >
      <audio ref={audioRef} src="/ghost-laugh.mp3" preload="auto" />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key={`s1-${sub}`} {...fade}>
            {sub === 0
              ? <h1 className="font-serif text-5xl sm:text-6xl text-charcoal">Hello, {name}</h1>
              : <h1 className="font-serif text-4xl sm:text-5xl text-charcoal/90">You have been cordially invited to…</h1>}
          </motion.div>
        )}

        {step === 2 && (
          <motion.h1 key="s2" {...fade}
            className="font-serif text-4xl sm:text-6xl leading-tight text-charcoal">
            The Huey &amp; Cherry Wedding
            <span className="block mt-3 text-2xl sm:text-3xl text-coral tracking-wide">Ormoc City · 2026</span>
          </motion.h1>
        )}

        {step === 3 && (
          <motion.div key="s3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.3 }}>
            <h1 className="font-serif text-4xl sm:text-5xl text-ruin">…now it&apos;s time to collect your payments.</h1>
            <button
              onClick={() => { audioRef.current?.play().catch(() => {}); onDone() }}
              className="mt-10 rounded-full border border-ruin/70 text-ruin px-8 py-3 hover:bg-ruin hover:text-black transition-colors duration-300">
              Continue
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
