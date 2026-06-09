'use client'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

// All the couple's photos (excludes the QR and the duplicate logo file).
const PHOTOS = [
  '/img/716369896_923395560742558_2327144751937572363_n.jpg',
  '/img/717128951_2054698551926794_9018887853168111203_n.jpg',
  '/img/717337100_1313074183862518_2448400245921237523_n.jpg',
  '/img/720085528_1420384016515743_5485884043054838952_n.jpg',
  '/img/720570613_2177718852985158_3049768111277135906_n.jpg',
  '/img/last.jpg',
]
const INTERVAL_MS = 3200

export default function LogoSlideshow({ className = '' }: { className?: string }) {
  const [i, setI] = useState(0)
  const reduce = useReducedMotion()

  // Preload so the crossfades are clean.
  useEffect(() => {
    PHOTOS.forEach((src) => { const img = new window.Image(); img.src = src })
  }, [])

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setI((n) => (n + 1) % PHOTOS.length), INTERVAL_MS)
    return () => clearInterval(id)
  }, [reduce])

  return (
    <div className={`relative overflow-hidden rounded-full ring-1 ring-sand shadow-sm ${className}`}>
      <AnimatePresence>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img
          key={i}
          src={PHOTOS[i]}
          alt="Huey & Cherry"
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>
    </div>
  )
}
