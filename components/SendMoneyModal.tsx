'use client'
import Modal from '@/components/Modal'
import { POOLS } from '@/lib/constants'

export default function SendMoneyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="send-title">
      <div className="text-center">
        <h3 id="send-title" className="font-serif text-2xl text-charcoal mb-1">Where to send money</h3>
        <p className="text-charcoal/60 text-sm mb-4">
          Scan with any InstaPay-enabled app.<br />
          GoTyme Bank · Keith Ruezyl Tagarao
        </p>

        <div className="mb-5 space-y-3 text-left">
          {[POOLS.fare, POOLS.fee].map((pool) => (
            <div key={pool.kind} className="rounded-xl bg-cream/60 ring-1 ring-sand/60 px-4 py-3">
              <p className="font-serif text-charcoal">{pool.title}</p>
              <ul className="mt-1 space-y-0.5 text-sm text-charcoal/60">
                {pool.details.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </div>
          ))}
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/qr.jpg" alt="GoTyme InstaPay QR code for Keith Ruezyl Tagarao"
          className="mx-auto max-w-xs max-h-96 w-auto object-contain rounded-2xl ring-1 ring-sand" />

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <a href="/img/qr.jpg" download="huey-cherry-gotyme-qr.jpg"
            className="inline-flex items-center gap-2 rounded-full bg-amber px-7 py-2.5 text-charcoal hover:bg-coral transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" />
            </svg>
            Download QR
          </a>
          <button onClick={onClose}
            className="rounded-full px-5 py-2.5 text-charcoal/70 hover:text-charcoal transition-colors">
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
