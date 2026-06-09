'use client'
import { motion, useReducedMotion } from 'motion/react'

export default function ProgressBar({ fraction }: { fraction: number }) {
  const reduce = useReducedMotion()
  const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100)
  return (
    <div className="h-3 w-full rounded-full bg-sand/60 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-amber to-coral"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={reduce ? { duration: 0 } : { duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
