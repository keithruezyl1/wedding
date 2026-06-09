'use client'
import Modal from '@/components/Modal'
import { Payer } from '@/lib/payments'

export default function ProofModal({ payer, onClose }: { payer: Payer | null; onClose: () => void }) {
  return (
    <Modal open={!!payer} onClose={onClose} labelledBy="proof-title">
      {payer && (
        <div className="text-center">
          <h3 id="proof-title" className="font-serif text-2xl text-charcoal mb-4">{payer.display_name}</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={payer.proof_url} alt={`Proof from ${payer.display_name}`}
               className="w-full rounded-xl ring-1 ring-sand object-contain max-h-[60vh]" />
          <button onClick={onClose}
            className="mt-6 rounded-full bg-amber px-7 py-2.5 text-charcoal hover:bg-coral transition-colors duration-300">
            Close
          </button>
        </div>
      )}
    </Modal>
  )
}
