'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function RequestEventPage() {
  const router = useRouter()
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null)
  const [form, setForm] = useState({ eventName: '', eventDate: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(async res => {
      if (!res.ok) { router.push('/admin/login'); return }
      const { admin } = await res.json()
      if (admin.isSuperAdmin) { router.push('/admin/events/new'); return }
      setIsSuperAdmin(false)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.eventName.trim() || !form.eventDate) {
      setError('Completá todos los campos')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: form.eventName, eventDate: form.eventDate }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al iniciar el pago')
        setSubmitting(false)
        return
      }
      // Redirect to MercadoPago checkout
      window.location.href = data.checkoutUrl
    } catch {
      setError('Error de conexión')
      setSubmitting(false)
    }
  }

  if (isSuperAdmin === null) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-3xl text-gold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Cargando...</p>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#34D399]/5 blur-[80px]" />
      </div>

      <header className="border-b border-[#1f2937] bg-[#080808]/95 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Total Pics" width={32} height={32} unoptimized />
            <span className="font-black tracking-widest uppercase text-white text-sm hidden sm:block" style={{ fontFamily: 'var(--font-exo2)' }}>
              TOTAL <span className="text-[#34D399]">PICS</span>
            </span>
          </Link>
          <Link href="/admin/dashboard" className="text-xs text-[#9ca3af] hover:text-white tracking-widest uppercase transition-colors">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16 relative">
        <div className="mb-10">
          <h1 className="text-3xl text-white" style={{ fontFamily: 'var(--font-space-grotesk)', fontStyle: 'italic' }}>
            Solicitar nuevo evento
          </h1>
          <div className="divider-gold w-24 mt-2" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card-dark p-6 space-y-5">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#9ca3af] mb-2">
                Nombre del evento <span className="text-[#34D399]">*</span>
              </label>
              <input
                type="text"
                value={form.eventName}
                onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))}
                placeholder="Ej: Casamiento Martina & Lucas"
                className="w-full bg-[#0f172a] border border-[#1f2937] focus:border-[#34D399]/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors placeholder-[#374151]"
                maxLength={80}
              />
            </div>

            <div>
              <label className="block text-xs tracking-widest uppercase text-[#9ca3af] mb-2">
                Fecha del evento <span className="text-[#34D399]">*</span>
              </label>
              <input
                type="date"
                value={form.eventDate}
                min={today}
                onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
                className="w-full bg-[#0f172a] border border-[#1f2937] focus:border-[#34D399]/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Price card */}
          <div className="card-dark p-5 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-semibold">Creación de evento</p>
              <p className="text-[#6b7280] text-xs mt-0.5">Cargo único por evento · Pago seguro vía Mercado Pago</p>
            </div>
            <div className="text-right">
              <p className="text-[#34D399] text-2xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>$1</p>
              <p className="text-[#6b7280] text-xs">ARS</p>
            </div>
          </div>

          <div className="bg-[#0f172a]/60 border border-[#1f2937]/50 rounded-xl p-4 text-xs text-[#6b7280] leading-relaxed">
            Una vez aprobado el pago, el evento se crea automáticamente y lo podrás configurar desde tu dashboard.
            Vas a necesitar conectar tu Google Drive para empezar a recibir fotos.
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800/40 rounded-xl py-3 px-4">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-gold py-4 rounded-xl text-sm tracking-widest uppercase font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Redirigiendo a Mercado Pago...' : 'Continuar al pago →'}
          </button>
        </form>
      </main>
    </div>
  )
}
