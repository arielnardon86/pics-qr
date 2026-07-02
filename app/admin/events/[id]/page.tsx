'use client'

import { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'

interface Photo {
  id: string; path: string; filename: string; uploadedBy: string | null; createdAt: string; driveFileId: string | null; driveFileUrl: string | null
}
interface Event {
  id: string; name: string; description: string | null; date: string; code: string
  isActive: boolean; slideshowInterval: number; nsfwFilter: boolean; uploadsPaused: boolean
  photos: Photo[]
  driveFolderId: string | null; driveFolderUrl: string | null
  googleAccessToken: string | null
  _count: { photos: number }
}
interface Admin { id: string; email: string; name: string; isSuperAdmin: boolean }
interface QRData { qr: string; url: string; code: string }
interface GoogleStatus { connected: boolean; email?: string }

function EventPageContent({ id }: { id: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [slideInterval, setSlideInterval] = useState(5)
  const [copying, setCopying] = useState(false)
  const [driveLoading, setDriveLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4500)
  }

  useEffect(() => {
    async function load() {
      const [eventRes, qrRes, meRes, googleRes] = await Promise.all([
        fetch(`/api/events/${id}`),
        fetch(`/api/events/${id}/qr`),
        fetch('/api/auth/me'),
        fetch(`/api/auth/google/status?eventId=${id}`),
      ])
      if (eventRes.status === 401) { router.push('/admin/login'); return }
      if (!eventRes.ok) { router.push('/admin/dashboard'); return }
      const eventData = await eventRes.json()
      setEvent(eventData.event)
      setSlideInterval(eventData.event.slideshowInterval)
      if (qrRes.ok) setQrData(await qrRes.json())
      if (meRes.ok) setAdmin((await meRes.json()).admin)
      if (googleRes.ok) setGoogleStatus(await googleRes.json())
      setLoading(false)
    }
    load()
  }, [id, router])

  useEffect(() => {
    if (searchParams.get('google_ok')) {
      showToast('Google Drive conectado correctamente ✓')
      window.history.replaceState({}, '', `/admin/events/${id}`)
      // Refresh google status
      fetch(`/api/auth/google/status?eventId=${id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setGoogleStatus(data) })
    }
    if (searchParams.get('google_error')) {
      showToast(decodeURIComponent(searchParams.get('google_error')!), 'err')
      window.history.replaceState({}, '', `/admin/events/${id}`)
    }
  }, [searchParams, id])

  async function saveInterval() {
    setSaving(true)
    await fetch(`/api/events/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slideshowInterval: slideInterval }),
    })
    setSaving(false)
    if (event) setEvent({ ...event, slideshowInterval: slideInterval })
  }

  async function toggleNsfwFilter() {
    if (!event) return
    const res = await fetch(`/api/events/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nsfwFilter: !event.nsfwFilter }),
    })
    if (res.ok) setEvent({ ...event, nsfwFilter: !event.nsfwFilter })
  }

  async function toggleUploadsPaused() {
    if (!event) return
    const res = await fetch(`/api/events/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadsPaused: !event.uploadsPaused }),
    })
    if (res.ok) {
      setEvent({ ...event, uploadsPaused: !event.uploadsPaused })
      showToast(event.uploadsPaused ? 'Subidas reactivadas ✓' : 'Subidas pausadas')
    }
  }

  async function deletePhoto(photoId: string) {
    const res = await fetch(`/api/events/${id}/photos/${photoId}`, { method: 'DELETE' })
    // Don't touch _count.photos — the file still lives in Google Drive
    if (res.ok) setEvent(e => e ? { ...e, photos: e.photos.filter(p => p.id !== photoId) } : e)
  }

  async function copyLink() {
    if (!qrData) return
    await navigator.clipboard.writeText(qrData.url)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  async function downloadQR() {
    if (!qrData || !event) return
    const W = 500
    const pad = 40
    const qrSize = 400
    const gap = 24
    const H = pad + qrSize + gap + 36 + 10 + 22 + pad
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)
    const img = new window.Image()
    img.src = qrData.qr
    await new Promise(r => { img.onload = r })
    ctx.drawImage(img, (W - qrSize) / 2, pad, qrSize, qrSize)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#1a1a2e'
    ctx.font = 'bold 28px monospace'
    ctx.fillText(qrData.code, W / 2, pad + qrSize + gap + 28)
    ctx.fillStyle = '#6b7280'
    ctx.font = '15px sans-serif'
    ctx.fillText('www.totalpics.com.ar', W / 2, pad + qrSize + gap + 28 + 10 + 18)
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `qr-${event.code}.png`
    link.click()
  }

  async function createDriveFolder() {
    setDriveLoading(true)
    const res = await fetch(`/api/events/${id}/drive`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    const data = await res.json()
    if (!res.ok) {
      showToast(data.error || 'Error al crear carpeta en Drive', 'err')
    } else {
      setEvent(e => e ? { ...e, driveFolderId: data.driveFolderId, driveFolderUrl: data.driveFolderUrl } : e)
      showToast('Carpeta creada en Google Drive ✓')
    }
    setDriveLoading(false)
  }

  async function disconnectDrive() {
    if (!confirm('¿Desconectar Google Drive? Los invitados no podrán subir fotos hasta que conectes una nueva cuenta.')) return
    const res = await fetch(`/api/events/${id}/drive`, { method: 'DELETE' })
    if (res.ok) {
      setEvent(e => e ? { ...e, driveFolderId: null, driveFolderUrl: null, googleAccessToken: null } : e)
      setGoogleStatus({ connected: false })
      showToast('Google Drive desvinculado')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-3xl text-gold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Cargando...</p>
      </div>
    )
  }
  if (!event) return null

  const isSuperAdmin = admin?.isSuperAdmin

  return (
    <div className="min-h-screen bg-[#080808]">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium tracking-wide border ${
          toast.type === 'ok'
            ? 'bg-[#34D399]/10 border-[#34D399]/40 text-white'
            : 'bg-red-900/20 border-red-800/40 text-red-400'
        }`}>
          {toast.msg}
        </div>
      )}

      <header className="border-b border-[#1f2937] bg-[#080808]/95 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-[#34D399]/50 hover:text-[#34D399] text-xs tracking-widest uppercase transition-colors">← Dashboard</Link>
            <div className="w-px h-4 bg-[#1f2937]" />
            <h1 className="text-white text-sm truncate max-w-[180px] sm:max-w-xs" style={{ fontFamily: 'var(--font-space-grotesk)', fontStyle: 'italic' }}>{event.name}</h1>
            {isSuperAdmin && (
              <span className={`hidden sm:inline text-xs font-semibold px-2.5 py-1 rounded-full border tracking-wider uppercase ${
                event.isActive ? 'bg-[#34D399]/10 text-white border-[#34D399]/30' : 'bg-[#1a1a1a] text-[#6b7280] border-[#1f2937]'
              }`}>{event.isActive ? 'Activo' : 'Inactivo'}</span>
            )}
          </div>
          <Link href={`/admin/events/${id}/slideshow`} target="_blank" className="btn-gold px-4 py-2 rounded-lg text-xs tracking-widest uppercase">Slideshow</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Row 1: QR + Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* QR Card */}
          <div className="card-dark p-6 glow-gold">
            <h2 className="text-white text-xs tracking-[0.25em] uppercase mb-5" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Código QR del evento</h2>
            {qrData && (
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-white rounded-2xl">
                  <Image src={qrData.qr} alt="QR" width={180} height={180} className="rounded-xl" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold text-gold tracking-[0.3em]">{qrData.code}</p>
                  <p className="text-xs text-[#6b7280] mt-1 break-all">{qrData.url}</p>
                </div>
                <div className="divider-gold w-full opacity-30" />
                <div className="flex gap-2 w-full">
                  <button onClick={copyLink} className="flex-1 border border-[#1f2937] hover:border-[#34D399]/50 text-[#34D399] hover:text-white py-2 rounded-lg text-xs tracking-widest uppercase transition-all">
                    {copying ? '✓ Copiado' : 'Copiar link'}
                  </button>
                  <button onClick={downloadQR} className="flex-1 bg-[#34D399]/10 hover:bg-[#34D399]/20 text-white py-2 rounded-lg text-xs tracking-widest uppercase transition-all">
                    Descargar QR
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings Card */}
          <div className="card-dark p-6 space-y-5">
            <h2 className="text-white text-xs tracking-[0.25em] uppercase" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Configuración</h2>
            <div>
              <p className="text-xs text-[#34D399]/60 tracking-widest uppercase mb-1">Fecha</p>
              <p className="text-[#f1f5f9] text-sm" style={{ fontFamily: 'var(--font-space-grotesk)', fontStyle: 'italic' }}>
                {new Date(event.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="divider-gold opacity-30" />
            <div>
              <p className="text-xs text-[#34D399]/60 tracking-widest uppercase mb-2">Intervalo slideshow</p>
              <div className="flex items-center gap-3">
                <input type="range" min="2" max="30" value={slideInterval} onChange={e => setSlideInterval(Number(e.target.value))} className="flex-1 accent-[#34D399]" />
                <span className="text-white font-semibold w-10 text-right text-sm" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{slideInterval}s</span>
              </div>
              <button onClick={saveInterval} disabled={saving || slideInterval === event.slideshowInterval} className="mt-2 text-xs btn-gold px-4 py-1.5 rounded-lg disabled:opacity-40">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
            <div className="divider-gold opacity-30" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#34D399]/60 tracking-widest uppercase">Subida de fotos</p>
                <p className="text-[#9ca3af] text-xs mt-0.5">
                  {event.uploadsPaused ? 'Pausada — los invitados no pueden subir' : 'Activa — los invitados pueden subir'}
                </p>
              </div>
              <button
                onClick={toggleUploadsPaused}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${event.uploadsPaused ? 'bg-amber-500/80' : 'bg-[#34D399]'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-[#080808] transition-transform ${event.uploadsPaused ? 'translate-x-1' : 'translate-x-6'}`} />
              </button>
            </div>

            <div className="divider-gold opacity-30" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#34D399]/60 tracking-widest uppercase">Filtro de contenido</p>
                <p className="text-[#9ca3af] text-xs mt-0.5">
                  {event.nsfwFilter ? 'Rechaza fotos inapropiadas automáticamente' : 'Sin filtro — se aceptan todas las fotos'}
                </p>
              </div>
              <button
                onClick={toggleNsfwFilter}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${event.nsfwFilter ? 'bg-[#34D399]' : 'bg-[#1f2937]'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-[#080808] transition-transform ${event.nsfwFilter ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

          </div>
        </div>

        {/* Google Drive Card */}
        <div className="card-dark p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xs tracking-[0.25em] uppercase" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Google Drive <span className="text-[#34D399]/40 normal-case font-normal">— requerido para recibir fotos</span>
            </h2>
            {event.driveFolderUrl && (
              <a href={event.driveFolderUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 tracking-wide transition-colors">
                Abrir en Drive ↗
              </a>
            )}
          </div>

          {!googleStatus.connected ? (
            /* Step 1: No Google account linked to this event */
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
              <div>
                <p className="text-[#f1f5f9] text-sm">Conectá una cuenta de Google Drive para este evento.</p>
                <p className="text-[#6b7280] text-xs mt-1">Cada evento puede tener su propia cuenta de Google Drive.</p>
              </div>
              <a
                href={`/api/auth/google?eventId=${id}`}
                className="btn-gold px-5 py-2 rounded-lg text-xs tracking-widest uppercase whitespace-nowrap"
              >
                Conectar Google Drive
              </a>
            </div>
          ) : !event.driveFolderId ? (
            /* Step 2: Google connected but no folder yet */
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
              <div>
                <p className="text-[#f1f5f9] text-sm">Cuenta conectada: <span className="text-[#34D399]">{googleStatus.email}</span></p>
                <p className="text-[#9ca3af] text-xs mt-1">Las fotos se guardarán directo en Drive. Creá la carpeta del evento para empezar.</p>
              </div>
              <button
                onClick={createDriveFolder}
                disabled={driveLoading}
                className="btn-gold px-5 py-2 rounded-lg text-xs tracking-widest uppercase disabled:opacity-50 whitespace-nowrap"
              >
                {driveLoading ? 'Creando...' : 'Crear carpeta en Drive'}
              </button>
            </div>
          ) : (
            /* Step 3: Everything configured */
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-xl border border-[#34D399]/20">
                <div className="w-8 h-8 rounded-lg bg-[#34D399]/10 border border-[#34D399]/30 flex items-center justify-center text-sm">📁</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{event.name}</p>
                  <p className="text-[#6b7280] text-xs mt-0.5">{googleStatus.email} · {event._count.photos} foto{event._count.photos !== 1 ? 's' : ''} en Drive</p>
                </div>
                <a href={event.driveFolderUrl!} target="_blank" rel="noopener noreferrer"
                   className="text-xs text-blue-400 hover:text-blue-300 border border-blue-900/30 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                  Ver en Drive
                </a>
              </div>
              <div className="flex gap-2 justify-end">
                <a
                  href={`/api/auth/google?eventId=${id}`}
                  className="border border-[#1f2937] hover:border-[#34D399]/40 text-[#9ca3af] hover:text-[#34D399] px-4 py-2 rounded-lg text-xs tracking-widest uppercase transition-all"
                >
                  Cambiar cuenta
                </a>
                <button
                  onClick={disconnectDrive}
                  className="border border-[#1f2937] hover:border-red-900/40 text-[#6b7280] hover:text-red-500/60 px-4 py-2 rounded-lg text-xs tracking-widest uppercase transition-all"
                >
                  Desconectar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Gallery */}
        <div className="card-dark p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white text-xs tracking-[0.25em] uppercase" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Galería · {event.photos.length} foto{event.photos.length !== 1 ? 's' : ''}
            </h2>
            {event.driveFolderUrl && event.photos.length > 0 && (
              <a href={event.driveFolderUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 tracking-wide transition-colors">
                Descargar desde Drive ↗
              </a>
            )}
          </div>

          {event.photos.length === 0 ? (
            <div className="text-center py-14 space-y-2">
              <p className="text-4xl text-gold opacity-30" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Sin fotos todavía</p>
              <p className="text-[#6b7280] text-sm">
                {event.driveFolderId
                  ? 'Compartí el QR para que los invitados empiecen a subir fotos'
                  : 'Configurá Google Drive para empezar a recibir fotos'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {event.photos.map(photo => (
                <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-[#111] group border border-[#1f2937]">
                  <a href={photo.driveFileUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <Image
                      src={photo.path} alt={photo.filename} fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 20vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {photo.uploadedBy && (
                      <div className="absolute bottom-0 inset-x-0 text-white text-xs px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity truncate" style={{ fontFamily: 'var(--font-space-grotesk)', fontStyle: 'italic' }}>
                        {photo.uploadedBy}
                      </div>
                    )}
                  </a>
                  <button
                    onClick={() => { if (confirm('¿Eliminar esta foto?')) deletePhoto(photo.id) }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#080808]/80 border border-red-900/40 text-red-400 hover:bg-red-900/60 hover:text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Eliminar foto"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <Suspense>
      <EventPageContent id={id} />
    </Suspense>
  )
}
