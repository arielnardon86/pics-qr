'use client'

import { useState } from 'react'
import { X, UserPlus, CalendarPlus, QrCode } from 'lucide-react'
import { useEventPrice, formatPrice } from '@/lib/useEventPrice'

const WHATSAPP_NUMBER = '5491141903897'
const DEFAULT_MESSAGE = 'Hola! Quiero info sobre Total Pics para mi evento 🙌'

const STEPS = [
  { icon: UserPlus,    title: 'Te registrás',      desc: 'Creá tu cuenta de organizador gratis, en un minuto.' },
  { icon: CalendarPlus, title: 'Creás tu evento',   desc: 'Cargás nombre y fecha, y pagás el cargo único del evento.' },
  { icon: QrCode,      title: 'Compartís el QR',    desc: 'Tus invitados escanean, suben fotos y las ven en pantalla en vivo.' },
]

function WhatsAppIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.78-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.7.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.85 9.85 0 01-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.83 9.83 0 016.99 2.9 9.82 9.82 0 012.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.94L.06 24l6.3-1.65a11.88 11.88 0 005.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41" />
    </svg>
  )
}

export default function WhatsAppFloat() {
  const [open, setOpen] = useState(false)
  const price = useEventPrice()

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
            <WhatsAppIcon size={18} />
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
        {open ? <X size={24} className="text-white" /> : <WhatsAppIcon size={28} className="text-white" />}
      </button>
    </div>
  )
}
