'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

interface Event {
  id: string
  name: string
  description: string | null
  date: string
  code: string
  isActive: boolean
  slideshowInterval: number
  driveFolderId: string | null
  _count: { photos: number }
}

interface GoogleStatus {
  connected: boolean
  email?: string
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<Event[]>([])
  const [adminName, setAdminName] = useState('')
  const [loading, setLoading] = useState(true)
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus>({ connected: false })
  const [googleLoading, setGoogleLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  useEffect(() => {
    async function load() {
      const [meRes, eventsRes, googleRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/events'),
        fetch('/api/auth/google/status'),
      ])
      if (!meRes.ok) { router.push('/admin/login'); return }
      setAdminName((await meRes.json()).admin.name)
      if (eventsRes.ok) setEvents((await eventsRes.json()).events)
      if (googleRes.ok) setGoogleStatus(await googleRes.json())
      setLoading(false)
    }
    load()
  }, [router])

  // Handle OAuth redirect toasts
  useEffect(() => {
    if (searchParams.get('google_ok')) {
      setToast({ msg: 'Cuenta de Google conectada correctamente ✓', type: 'ok' })
      // Refresh google status
      fetch('/api/auth/google/status').then(r => r.json()).then(setGoogleStatus)
    } else if (searchParams.get('google_error')) {
      setToast({ msg: decodeURIComponent(searchParams.get('google_error')!), type: 'err' })
    }
    if (searchParams.get('google_ok') || searchParams.get('google_error')) {
      window.history.replaceState({}, '', '/admin/dashboard')
    }
  }, [searchParams])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  async function connectGoogle() {
    setGoogleLoading(true)
    window.location.href = '/api/auth/google'
  }

  async function disconnectGoogle() {
    if (!confirm('¿Desconectar cuenta de Google? Las fotos ya subidas a Drive no se eliminarán.')) return
    await fetch('/api/auth/google', { method: 'DELETE' })
    setGoogleStatus({ connected: false })
    setToast({ msg: 'Cuenta de Google desconectada', type: 'ok' })
  }

  async function deleteEvent(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
    if (res.ok) setEvents(e => e.filter(ev => ev.id !== id))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="font-script text-3xl text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium tracking-wide border transition-all ${
          toast.type === 'ok'
            ? 'bg-[#C9A132]/10 border-[#C9A132]/40 text-[#F5D87A]'
            : 'bg-red-900/20 border-red-800/40 text-red-400'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-[#2B2210] bg-[#080808]/95 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <p className="font-script text-3xl text-gold leading-none" style={{ fontFamily: 'var(--font-great-vibes)' }}>Freedom</p>
            <span className="text-[#C9A132]/40 text-xs tracking-[0.3em] uppercase hidden sm:block" style={{ fontFamily: 'var(--font-playfair)' }}>Fotos</span>
          </Link>
          <div className="flex items-center gap-5">
            <span className="text-[#8a7a5a] text-sm hidden sm:block">{adminName}</span>
            <button onClick={handleLogout} className="text-xs text-[#C9A132]/60 hover:text-[#F5D87A] tracking-widest uppercase transition-colors">Salir</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Google Drive connection banner */}
        <div className={`card-dark p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${
          googleStatus.connected ? 'border-[#C9A132]/30' : 'border-[#2B2210]'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border ${
              googleStatus.connected
                ? 'bg-[#C9A132]/10 border-[#C9A132]/30 text-[#F5D87A]'
                : 'bg-[#111] border-[#2B2210] text-[#5a4f3a]'
            }`}>
              {googleStatus.connected ? '✓' : 'G'}
            </div>
            <div>
              <p className="text-xs text-[#C9A132]/60 tracking-widest uppercase mb-0.5" style={{ fontFamily: 'var(--font-playfair)' }}>
                Google Drive
              </p>
              {googleStatus.connected ? (
                <p className="text-[#F5EDD8] text-sm">{googleStatus.email}</p>
              ) : (
                <p className="text-[#8a7a5a] text-sm">Conectá tu cuenta para guardar fotos en Drive automáticamente</p>
              )}
            </div>
          </div>

          {googleStatus.connected ? (
            <button
              onClick={disconnectGoogle}
              className="text-xs border border-[#2B2210] hover:border-red-900/50 text-[#5a4f3a] hover:text-red-500/70 px-4 py-2 rounded-lg tracking-widest uppercase transition-all whitespace-nowrap"
            >
              Desconectar
            </button>
          ) : (
            <button
              onClick={connectGoogle}
              disabled={googleLoading}
              className="btn-gold px-5 py-2 rounded-lg text-xs tracking-widest uppercase whitespace-nowrap disabled:opacity-50"
            >
              {googleLoading ? 'Redirigiendo...' : 'Conectar Google'}
            </button>
          )}
        </div>

        {/* Events section */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl text-[#F5D87A]" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>Mis Eventos</h1>
            <div className="divider-gold w-24 mt-2" />
          </div>
          <Link href="/admin/events/new" className="btn-gold px-6 py-2.5 rounded-xl text-xs tracking-widest uppercase">
            + Nuevo evento
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <p className="font-script text-5xl text-gold opacity-40" style={{ fontFamily: 'var(--font-great-vibes)' }}>Sin eventos aún</p>
            <p className="text-[#5a4f3a] text-sm tracking-wide">Creá tu primer evento para empezar</p>
            <Link href="/admin/events/new" className="btn-gold inline-block px-8 py-3 rounded-xl text-xs tracking-widest uppercase mt-4">Crear evento</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map(event => (
              <div key={event.id} className="card-dark p-6 hover:border-[#C9A132]/40 transition-all duration-300" style={{ borderColor: '#2B2210' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-[#F5D87A] font-semibold text-lg leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>{event.name}</h3>
                    <p className="text-[#8a7a5a] text-xs mt-1 tracking-wide">
                      {new Date(event.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border tracking-wider uppercase ${
                      event.isActive ? 'bg-[#C9A132]/10 text-[#F5D87A] border-[#C9A132]/30' : 'bg-[#1a1a1a] text-[#5a4f3a] border-[#2B2210]'
                    }`}>
                      {event.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    {event.driveFolderId && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/20 border border-blue-900/30 text-blue-400 tracking-wider">
                        Drive ✓
                      </span>
                    )}
                  </div>
                </div>

                <div className="divider-gold mb-4 opacity-40" />

                <div className="flex items-center gap-5 text-xs text-[#8a7a5a] mb-5 tracking-wide">
                  <span><span className="text-[#C9A132]">◆</span> {event._count.photos} fotos</span>
                  <span><span className="text-[#C9A132]">◆</span> <span className="font-mono text-[#F5D87A]">{event.code}</span></span>
                </div>

                <div className="flex gap-2">
                  <Link href={`/admin/events/${event.id}`} className="flex-1 text-center border border-[#2B2210] hover:border-[#C9A132]/50 text-[#C9A132] hover:text-[#F5D87A] py-2 rounded-lg text-xs tracking-widest uppercase transition-all">Gestionar</Link>
                  <Link href={`/admin/events/${event.id}/slideshow`} target="_blank" className="flex-1 text-center bg-[#C9A132]/10 hover:bg-[#C9A132]/20 text-[#F5D87A] py-2 rounded-lg text-xs tracking-widest uppercase transition-all">Slideshow</Link>
                  <button onClick={() => deleteEvent(event.id, event.name)} className="px-3 py-2 text-[#5a4f3a] hover:text-red-500/70 hover:bg-red-900/10 rounded-lg transition-colors text-xs">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  )
}
