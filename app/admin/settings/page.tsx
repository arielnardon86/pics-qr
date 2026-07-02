'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Settings {
  event_price: string
  upload_hours_before: string
  upload_hours_after: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<Settings>({ event_price: '', upload_hours_before: '', upload_hours_after: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    async function load() {
      const meRes = await fetch('/api/auth/me')
      if (!meRes.ok) { router.push('/admin/login'); return }
      const { admin } = await meRes.json()
      if (!admin.isSuperAdmin) { router.push('/admin/dashboard'); return }

      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const { settings: s } = await res.json()
        setSettings(s)
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_price: settings.event_price,
        upload_hours_before: settings.upload_hours_before,
        upload_hours_after: settings.upload_hours_after,
      }),
    })
    if (res.ok) {
      const { settings: s } = await res.json()
      setSettings(s)
      showToast('Configuración guardada ✓')
    } else {
      showToast('Error al guardar', 'err')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-3xl text-gold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Cargando...</p>
      </div>
    )
  }

  const before = Number(settings.upload_hours_before) || 24
  const after = Number(settings.upload_hours_after) || 48

  return (
    <div className="min-h-screen bg-[#080808]">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium tracking-wide border ${
          toast.type === 'ok' ? 'bg-[#34D399]/10 border-[#34D399]/40 text-white' : 'bg-red-900/20 border-red-800/40 text-red-400'
        }`}>{toast.msg}</div>
      )}

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

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl text-white" style={{ fontFamily: 'var(--font-space-grotesk)', fontStyle: 'italic' }}>
            Configuración global
          </h1>
          <div className="divider-gold w-24 mt-2" />
        </div>

        <form onSubmit={handleSave} className="space-y-5">

          {/* Precio */}
          <div className="card-dark p-6 space-y-4">
            <div>
              <p className="text-white text-sm font-semibold tracking-wide">Precio de creación de evento</p>
              <p className="text-[#6b7280] text-xs mt-0.5">Lo que paga cada cliente al solicitar un nuevo evento vía Mercado Pago.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#9ca3af] text-sm">$</span>
              <input
                type="number"
                min="1"
                step="1"
                value={settings.event_price}
                onChange={e => setSettings(s => ({ ...s, event_price: e.target.value }))}
                className="w-40 bg-[#0f172a] border border-[#1f2937] focus:border-[#34D399]/50 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-colors"
              />
              <span className="text-[#6b7280] text-sm">ARS</span>
            </div>
          </div>

          {/* Ventana de tiempo */}
          <div className="card-dark p-6 space-y-4">
            <div>
              <p className="text-white text-sm font-semibold tracking-wide">Ventana de uso del QR</p>
              <p className="text-[#6b7280] text-xs mt-0.5">Durante cuánto tiempo antes y después del evento los invitados pueden subir fotos.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#9ca3af] mb-2">Horas antes</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="168"
                    step="1"
                    value={settings.upload_hours_before}
                    onChange={e => setSettings(s => ({ ...s, upload_hours_before: e.target.value }))}
                    className="w-24 bg-[#0f172a] border border-[#1f2937] focus:border-[#34D399]/50 rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-colors"
                  />
                  <span className="text-[#6b7280] text-xs">hs</span>
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#9ca3af] mb-2">Horas después</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="168"
                    step="1"
                    value={settings.upload_hours_after}
                    onChange={e => setSettings(s => ({ ...s, upload_hours_after: e.target.value }))}
                    className="w-24 bg-[#0f172a] border border-[#1f2937] focus:border-[#34D399]/50 rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-colors"
                  />
                  <span className="text-[#6b7280] text-xs">hs</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0f172a]/60 border border-[#1f2937]/50 rounded-xl px-4 py-3 text-xs text-[#6b7280]">
              El QR estará activo desde{' '}
              <span className="text-[#34D399]">{before}h antes</span>
              {' '}hasta{' '}
              <span className="text-[#34D399]">{after}h después</span>
              {' '}del evento.
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full btn-gold py-3.5 rounded-xl text-sm tracking-widest uppercase font-semibold disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </form>
      </main>
    </div>
  )
}
