'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, X, UserPlus, CalendarPlus, QrCode } from 'lucide-react'

const WHATSAPP_NUMBER = '5491141903897'
const DEFAULT_MESSAGE = 'Hola! Quiero info sobre Total Pics para mi evento 🙌'
const FALLBACK_PRICE = 5000

const STEPS = [
  { icon: UserPlus,    title: 'Te registrás',      desc: 'Creá tu cuenta de organizador gratis, en un minuto.' },
  { icon: CalendarPlus, title: 'Creás tu evento',   desc: 'Cargás nombre y fecha, y pagás el cargo único del evento.' },
  { icon: QrCode,      title: 'Compartís el QR',    desc: 'Tus invitados escanean, suben fotos y las ven en pantalla en vivo.' },
]

function formatPrice(price: number) {
  return price.toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

export default function WhatsAppFloat() {
  const [open, setOpen] = useState(false)
  const [price, setPrice] = useState<number | null>(null)

  useEffect(() => {
    if (!open || price !== null) return
    fetch('/api/public/price')
      .then(res => res.json())
      .then(data => setPrice(typeof data.price === 'number' && !isNaN(data.price) ? data.price : FALLBACK_PRICE))
      .catch(() => setPrice(FALLBACK_PRICE))
  }, [open, price])

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="card-dark w-[calc(100vw-2.5rem)] max-w-sm p-5 shadow-2xl animate-[fadeIn_0.15s_ease-out]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white font-bold text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-exo2)' }}>
                ¿Cómo funciona?
              </p>
              <p className="text-[#6b7280] text-xs mt-0.5">Para organizadores de eventos</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="text-[#6b7280] hover:text-white transition-colors -mt-1 -mr-1 p-1"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3 mb-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex gap-3">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-[#34D399]/10 border border-[#34D399]/20 flex items-center justify-center">
                  <step.icon size={15} className="text-[#34D399]" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">{i + 1}. {step.title}</p>
                  <p className="text-[#6b7280] text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-[#0f172a] border border-[#1f2937] p-4 flex items-center justify-between mb-4">
            <div>
              <p className="text-white text-xs font-semibold">Costo del servicio</p>
              <p className="text-[#6b7280] text-[11px] mt-0.5">Cargo único por evento</p>
            </div>
            <div className="text-right">
              {price !== null ? (
                <p className="text-[#34D399] text-xl font-bold" style={{ fontFamily: 'var(--font-exo2)' }}>
                  ${formatPrice(price)} <span className="text-xs text-[#6b7280] font-normal">ARS</span>
                </p>
              ) : (
                <p className="text-[#6b7280] text-xs">Cargando...</p>
              )}
            </div>
          </div>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold tracking-wide text-white transition-transform hover:-translate-y-0.5"
            style={{ background: '#25D366' }}
          >
            <MessageCircle size={18} strokeWidth={2} />
            Escribinos por WhatsApp
          </a>
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Cerrar chat de WhatsApp' : 'Abrir chat de WhatsApp'}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-black/40 transition-transform hover:scale-105"
        style={{ background: '#25D366' }}
      >
        {open ? <X size={24} className="text-white" /> : <MessageCircle size={26} className="text-white" fill="white" strokeWidth={0} />}
      </button>
    </div>
  )
}
