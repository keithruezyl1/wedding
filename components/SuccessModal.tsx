'use client'
import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import Modal from '@/components/Modal'

export default function SuccessModal({ open, name, onClose }: { open: boolean; name: string; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 },
      colors: ['#E8A14B', '#E07A5F', '#FBF6EE'] })
  }, [open])
  return (
    <Modal open={open} onClose={onClose} labelledBy="success-title">
      <div className="text-center">
        <div className="text-4xl mb-3">🌅</div>
        <h3 id="success-title" className="font-serif text-3xl text-charcoal mb-2">Thank you, {name}</h3>
        <p className="text-charcoal/60">Your contribution is recorded.</p>
        <button onClick={onClose}
          className="mt-7 rounded-full bg-amber px-8 py-3 text-charcoal hover:bg-coral transition-colors duration-300">
          Lovely
        </button>
      </div>
    </Modal>
  )
}
