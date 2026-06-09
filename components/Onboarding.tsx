'use client'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import confetti from 'canvas-confetti'

type Step = 1 | 2 | 3
const EASE = [0.22, 1, 0.36, 1] as const

// All the couple's photos, with the sunset beach shot held LAST.
const PHOTOS = [
  '/img/716369896_923395560742558_2327144751937572363_n.jpg',
  '/img/717128951_2054698551926794_9018887853168111203_n.jpg',
  '/img/717337100_1313074183862518_2448400245921237523_n.jpg',
  '/img/720085528_1420384016515743_5485884043054838952_n.jpg',
  '/img/720570613_2177718852985158_3049768111277135906_n.jpg',
  '/img/last.jpg',
]
const PHOTO_MS = 900   // time each photo holds
const LAST_HOLD_MS = 1900 // extra beat on last.jpg before fading to black

export default function Onboarding({ name, onDone }: { name: string; onDone: () => void }) {
  const [step, setStep] = useState<Step>(1)
  const [sub, setSub] = useState(0)
  const [photoIdx, setPhotoIdx] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const reduce = useReducedMotion()

  // Preload every photo on mount so the montage crossfades cleanly.
  useEffect(() => {
    PHOTOS.forEach((src) => { const img = new window.Image(); img.src = src })
  }, [])

  // Step 1: "Hello, {name}" then "You have been cordially invited to…"
  useEffect(() => {
    if (step !== 1) return
    const t1 = setTimeout(() => setSub(1), 2600)
    const t2 = setTimeout(() => setStep(2), 5600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [step])

  // Step 2: confetti + a crossfading photo montage ending held on last.jpg.
  useEffect(() => {
    if (step !== 2) return
    const fire = () => confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 },
      colors: ['#E8A14B', '#E07A5F', '#FBF6EE', '#E7D3B8'] })
    fire()
    const burst = setTimeout(fire, 700)

    let idx = 0
    let toStep3: ReturnType<typeof setTimeout>
    const advance = setInterval(() => {
      idx += 1
      setPhotoIdx(idx)
      if (idx >= PHOTOS.length - 1) {
        clearInterval(advance)
        toStep3 = setTimeout(() => setStep(3), LAST_HOLD_MS)
      }
    }, PHOTO_MS)

    return () => { clearTimeout(burst); clearInterval(advance); clearTimeout(toStep3) }
  }, [step])

  // Step 3: play the ghost laugh.
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
      className="fixed inset-0 z-40 flex items-center justify-center text-center px-6 overflow-hidden"
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
          <motion.div key="s2" className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE }}>
            {/* Crossfading photo montage with a gentle Ken Burns drift */}
            <AnimatePresence>
              <motion.img
                key={photoIdx}
                src={PHOTOS[photoIdx]}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ opacity: 0, scale: reduce ? 1 : 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 1.0, ease: EASE }, scale: { duration: 4, ease: 'linear' } }}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-charcoal/45" />

            <div className="absolute inset-0 flex items-center justify-center px-6">
              <motion.h1 {...fade}
                className="font-serif text-4xl sm:text-6xl leading-tight text-ivory drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
                The Huey &amp; Cherry Wedding
                <span className="block mt-3 text-2xl sm:text-3xl text-amber tracking-wide">Ormoc City · 2026</span>
              </motion.h1>
            </div>
          </motion.div>
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
