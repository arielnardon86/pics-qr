'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'

interface Event {
  id: string; name: string; description: string | null; date: string; code: string
  isActive: boolean; driveFolderId: string | null
  _count: { photos: number }
  client: { id: string; name: string; email: string } | null
}
interface Admin { id: string; email: string; name: string; isSuperAdmin: boolean }

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<Event[]>([])
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    async function load() {
      const [meRes, eventsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/events'),
      ])
      if (!meRes.ok) { router.push('/admin/login'); return }
      setAdmin((await meRes.json()).admin)
      if (eventsRes.ok) setEvents((await eventsRes.json()).events)
      setLoading(false)
    }
    load()
  }, [router])

  useEffect(() => {
    if (searchParams.get('google_error')) {
      showToast(decodeURIComponent(searchParams.get('google_error')!), 'err')
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

  async function deleteEvent(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
    if (res.ok) setEvents(e => e.filter(ev => ev.id !== id))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-3xl text-gold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Cargando...</p>
      </div>
    )
  }

  const isSuperAdmin = admin?.isSuperAdmin

  return (
    <div className="min-h-screen bg-[#080808]">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium tracking-wide border ${
          toast.type === 'ok' ? 'bg-[#34D399]/10 border-[#34D399]/40 text-white' : 'bg-red-900/20 border-red-800/40 text-red-400'
        }`}>{toast.msg}</div>
      )}

      <header className="border-b border-[#1f2937] bg-[#080808]/95 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Total Pics" width={32} height={32} unoptimized />
            <span className="font-black tracking-widest uppercase text-white text-sm hidden sm:block" style={{ fontFamily: 'var(--font-exo2)' }}>
              TOTAL <span className="text-[#34D399]">PICS</span>
            </span>
          </Link>
          <div className="flex items-center gap-5">
            {isSuperAdmin && (
              <Link href="/admin/clients" className="text-xs text-[#34D399]/70 hover:text-white tracking-widest uppercase transition-colors">
                Clientes
              </Link>
            )}
            <span className="text-[#9ca3af] text-sm hidden sm:block">{admin?.name}</span>
            <button onClick={handleLogout} className="text-xs text-[#34D399]/60 hover:text-white tracking-widest uppercase transition-colors">Salir</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl text-white" style={{ fontFamily: 'var(--font-space-grotesk)', fontStyle: 'italic' }}>
              {isSuperAdmin ? 'Todos los Eventos' : 'Mis Eventos'}
            </h1>
            <div className="divider-gold w-24 mt-2" />
          </div>
          {isSuperAdmin && (
            <Link href="/admin/events/new" className="btn-gold px-6 py-2.5 rounded-xl text-xs tracking-widest uppercase">
              + Nuevo evento
            </Link>
          )}
        </div>

        {events.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <p className="text-5xl text-gold opacity-40" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              {isSuperAdmin ? 'Sin eventos aún' : 'Sin eventos asignados'}
            </p>
            <p className="text-[#6b7280] text-sm tracking-wide">
              {isSuperAdmin ? 'Creá tu primer evento para empezar' : 'El administrador te asignará eventos próximamente'}
            </p>
            {isSuperAdmin && (
              <Link href="/admin/events/new" className="btn-gold inline-block px-8 py-3 rounded-xl text-xs tracking-widest uppercase mt-4">Crear evento</Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map(event => (
              <div key={event.id} className="card-dark p-6 hover:border-[#34D399]/40 transition-all duration-300" style={{ borderColor: '#1f2937' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg leading-tight truncate" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{event.name}</h3>
                    <p className="text-[#9ca3af] text-xs mt-1 tracking-wide">
                      {new Date(event.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    {isSuperAdmin && event.client && (
                      <p className="text-[#34D399]/50 text-xs mt-1">Cliente: {event.client.name}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 ml-3 shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border tracking-wider uppercase ${
                      event.isActive ? 'bg-[#34D399]/10 text-white border-[#34D399]/30' : 'bg-[#1a1a1a] text-[#6b7280] border-[#1f2937]'
                    }`}>{event.isActive ? 'Activo' : 'Inactivo'}</span>
                    {event.driveFolderId && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/20 border border-blue-900/30 text-blue-400 tracking-wider">Drive ✓</span>
                    )}
                  </div>
                </div>

                <div className="divider-gold mb-4 opacity-40" />

                <div className="flex items-center gap-5 text-xs text-[#9ca3af] mb-5 tracking-wide">
                  <span><span className="text-[#34D399]">◆</span> {event._count.photos} fotos</span>
                  <span><span className="text-[#34D399]">◆</span> <span className="font-mono text-white">{event.code}</span></span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/events/${event.id}`} className="flex-1 text-center border border-[#1f2937] hover:border-[#34D399]/50 text-[#34D399] hover:text-white py-2 rounded-lg text-xs tracking-widest uppercase transition-all">Gestionar</Link>
                  <Link href={`/admin/events/${event.id}/slideshow`} target="_blank" className="flex-1 text-center bg-[#34D399]/10 hover:bg-[#34D399]/20 text-white py-2 rounded-lg text-xs tracking-widest uppercase transition-all">Slideshow</Link>
                  {isSuperAdmin && (
                    <button onClick={() => deleteEvent(event.id, event.name)} className="px-3 py-2 text-[#6b7280] hover:text-red-500/70 hover:bg-red-900/10 rounded-lg transition-colors text-xs">✕</button>
                  )}
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
