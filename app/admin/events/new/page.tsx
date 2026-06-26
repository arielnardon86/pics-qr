'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewEventPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', description: '', date: '', slideshowInterval: 5 })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) { router.push('/admin/login'); return }
        setError(data.error || 'Error al crear el evento')
      } else {
        router.push(`/admin/events/${data.event.id}`)
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <header className="border-b border-[#2B2210] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-[#C9A132]/50 hover:text-[#C9A132] text-sm tracking-widest uppercase transition-colors">
            ← Volver
          </Link>
          <div className="w-px h-4 bg-[#2B2210]" />
          <h1 className="text-[#F5D87A] text-sm tracking-[0.2em] uppercase"
              style={{ fontFamily: 'var(--font-playfair)' }}>
            Nuevo Evento
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <p className="font-script text-5xl text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>
            Nuevo Evento
          </p>
          <div className="divider-gold mx-auto w-32 mt-3" />
        </div>

        <div className="card-dark p-8 glow-gold space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-[#C9A132]/70 mb-1.5 tracking-widest uppercase">
                Nombre del evento *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input-dark"
                placeholder="Casamiento de Ana y Carlos"
              />
            </div>

            <div>
              <label className="block text-xs text-[#C9A132]/70 mb-1.5 tracking-widest uppercase">
                Descripción (opcional)
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="input-dark resize-none"
                placeholder="Una pequeña descripción del evento..."
              />
            </div>

            <div>
              <label className="block text-xs text-[#C9A132]/70 mb-1.5 tracking-widest uppercase">
                Fecha del evento *
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="input-dark [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#C9A132]/70 mb-2 tracking-widest uppercase">
                Intervalo del slideshow
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={form.slideshowInterval}
                  onChange={e => setForm(f => ({ ...f, slideshowInterval: Number(e.target.value) }))}
                  className="flex-1 accent-[#C9A132]"
                />
                <span className="text-[#F5D87A] font-semibold w-14 text-right text-sm"
                      style={{ fontFamily: 'var(--font-playfair)' }}>
                  {form.slideshowInterval}s
                </span>
              </div>
              <p className="text-xs text-[#5a4f3a] mt-1 tracking-wide">
                Tiempo que se muestra cada foto en el slideshow
              </p>
            </div>

            {error && (
              <div className="border border-red-900/40 bg-red-900/10 text-red-400 rounded-xl px-4 py-3 text-sm text-center">
                {error}
              </div>
            )}

            <div className="divider-gold opacity-30" />

            <div className="flex gap-3">
              <Link
                href="/admin/dashboard"
                className="flex-1 text-center border border-[#2B2210] text-[#8a7a5a] hover:text-[#C9A132] py-3 rounded-xl text-xs tracking-widest uppercase transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-gold py-3 rounded-xl text-xs tracking-widest uppercase"
              >
                {loading ? 'Creando...' : 'Crear Evento'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
