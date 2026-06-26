'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Photo {
  id: string; path: string; filename: string; uploadedBy: string | null; createdAt: string; driveFileId: string | null; driveFileUrl: string | null
}
interface Event {
  id: string; name: string; description: string | null; date: string; code: string
  isActive: boolean; slideshowInterval: number; photos: Photo[]
  driveFolderId: string | null; driveFolderUrl: string | null
  _count: { photos: number }
}
interface QRData { qr: string; url: string; code: string }
interface GoogleStatus { connected: boolean; email?: string }

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
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
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    async function load() {
      const [eventRes, qrRes, googleRes] = await Promise.all([
        fetch(`/api/events/${id}`),
        fetch(`/api/events/${id}/qr`),
        fetch('/api/auth/google/status'),
      ])
      if (eventRes.status === 401) { router.push('/admin/login'); return }
      if (!eventRes.ok) { router.push('/admin/dashboard'); return }
      const eventData = await eventRes.json()
      setEvent(eventData.event)
      setSlideInterval(eventData.event.slideshowInterval)
      if (qrRes.ok) setQrData(await qrRes.json())
      if (googleRes.ok) setGoogleStatus(await googleRes.json())
      setLoading(false)
    }
    load()
  }, [id, router])

  async function saveInterval() {
    setSaving(true)
    await fetch(`/api/events/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slideshowInterval: slideInterval }),
    })
    setSaving(false)
    if (event) setEvent({ ...event, slideshowInterval: slideInterval })
  }

  async function toggleActive() {
    if (!event) return
    const res = await fetch(`/api/events/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !event.isActive }),
    })
    if (res.ok) setEvent({ ...event, isActive: !event.isActive })
  }

  async function copyLink() {
    if (!qrData) return
    await navigator.clipboard.writeText(qrData.url)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
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

  async function unlinkDrive() {
    if (!confirm('¿Desvincular la carpeta de Drive? Los invitados no podrán subir fotos hasta que configures una nueva carpeta.')) return
    const res = await fetch(`/api/events/${id}/drive`, { method: 'DELETE' })
    if (res.ok) {
      setEvent(e => e ? { ...e, driveFolderId: null, driveFolderUrl: null } : e)
      showToast('Carpeta de Drive desvinculada')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="font-script text-3xl text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>Cargando...</p>
      </div>
    )
  }
  if (!event) return null

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium tracking-wide border ${
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
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-[#C9A132]/50 hover:text-[#C9A132] text-xs tracking-widest uppercase transition-colors">← Dashboard</Link>
            <div className="w-px h-4 bg-[#2B2210]" />
            <h1 className="text-[#F5D87A] text-sm truncate max-w-[180px] sm:max-w-none" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>{event.name}</h1>
            <span className={`hidden sm:inline text-xs font-semibold px-2.5 py-1 rounded-full border tracking-wider uppercase ${
              event.isActive ? 'bg-[#C9A132]/10 text-[#F5D87A] border-[#C9A132]/30' : 'bg-[#1a1a1a] text-[#5a4f3a] border-[#2B2210]'
            }`}>{event.isActive ? 'Activo' : 'Inactivo'}</span>
          </div>
          <Link href={`/admin/events/${id}/slideshow`} target="_blank" className="btn-gold px-4 py-2 rounded-lg text-xs tracking-widest uppercase">Slideshow</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Row 1: QR + Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* QR Card */}
          <div className="card-dark p-6 glow-gold">
            <h2 className="text-[#F5D87A] text-xs tracking-[0.25em] uppercase mb-5" style={{ fontFamily: 'var(--font-playfair)' }}>Código QR del evento</h2>
            {qrData && (
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-white rounded-2xl">
                  <Image src={qrData.qr} alt="QR" width={180} height={180} className="rounded-xl" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold text-gold tracking-[0.3em]">{qrData.code}</p>
                  <p className="text-xs text-[#5a4f3a] mt-1 break-all">{qrData.url}</p>
                </div>
                <div className="divider-gold w-full opacity-30" />
                <div className="flex gap-2 w-full">
                  <button onClick={copyLink} className="flex-1 border border-[#2B2210] hover:border-[#C9A132]/50 text-[#C9A132] hover:text-[#F5D87A] py-2 rounded-lg text-xs tracking-widest uppercase transition-all">
                    {copying ? '✓ Copiado' : 'Copiar link'}
                  </button>
                  <a href={qrData.qr} download={`qr-${event.code}.png`} className="flex-1 text-center bg-[#C9A132]/10 hover:bg-[#C9A132]/20 text-[#F5D87A] py-2 rounded-lg text-xs tracking-widest uppercase transition-all">
                    Descargar QR
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Settings Card */}
          <div className="card-dark p-6 space-y-5">
            <h2 className="text-[#F5D87A] text-xs tracking-[0.25em] uppercase" style={{ fontFamily: 'var(--font-playfair)' }}>Configuración</h2>
            <div>
              <p className="text-xs text-[#C9A132]/60 tracking-widest uppercase mb-1">Fecha</p>
              <p className="text-[#F5EDD8] text-sm" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>
                {new Date(event.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="divider-gold opacity-30" />
            <div>
              <p className="text-xs text-[#C9A132]/60 tracking-widest uppercase mb-2">Intervalo slideshow</p>
              <div className="flex items-center gap-3">
                <input type="range" min="2" max="30" value={slideInterval} onChange={e => setSlideInterval(Number(e.target.value))} className="flex-1 accent-[#C9A132]" />
                <span className="text-[#F5D87A] font-semibold w-10 text-right text-sm" style={{ fontFamily: 'var(--font-playfair)' }}>{slideInterval}s</span>
              </div>
              <button onClick={saveInterval} disabled={saving || slideInterval === event.slideshowInterval} className="mt-2 text-xs btn-gold px-4 py-1.5 rounded-lg disabled:opacity-40">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
            <div className="divider-gold opacity-30" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#C9A132]/60 tracking-widest uppercase">Recepción de fotos</p>
                <p className="text-[#8a7a5a] text-xs mt-0.5">
                  {!event.driveFolderId
                    ? 'Requiere Drive configurado'
                    : event.isActive
                      ? 'Los invitados pueden subir fotos'
                      : 'No se aceptan fotos nuevas'}
                </p>
              </div>
              <button
                onClick={toggleActive}
                disabled={!event.driveFolderId}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 ${event.isActive ? 'bg-[#C9A132]' : 'bg-[#2B2210]'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-[#080808] transition-transform ${event.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Google Drive Card */}
        <div className="card-dark p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[#F5D87A] text-xs tracking-[0.25em] uppercase" style={{ fontFamily: 'var(--font-playfair)' }}>
              Google Drive <span className="text-[#C9A132]/40 normal-case font-normal">— requerido</span>
            </h2>
            {event.driveFolderUrl && (
              <a
                href={event.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 tracking-wide transition-colors"
              >
                Abrir en Drive ↗
              </a>
            )}
          </div>

          {!googleStatus.connected ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
              <div>
                <p className="text-[#8a7a5a] text-sm">Tu cuenta de Google no está conectada.</p>
                <p className="text-[#5a4f3a] text-xs mt-0.5">Conectala desde el Dashboard para habilitar la subida de fotos.</p>
              </div>
              <Link href="/admin/dashboard" className="text-xs border border-[#2B2210] hover:border-[#C9A132]/40 text-[#C9A132] px-4 py-2 rounded-lg tracking-widest uppercase transition-all whitespace-nowrap">
                Ir al Dashboard
              </Link>
            </div>
          ) : !event.driveFolderId ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
              <div>
                <p className="text-[#F5EDD8] text-sm">Cuenta conectada: <span className="text-[#C9A132]">{googleStatus.email}</span></p>
                <p className="text-[#8a7a5a] text-xs mt-0.5">Las fotos se guardan directo en Drive. Creá la carpeta del evento para empezar.</p>
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
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-xl border border-[#C9A132]/20">
                <div className="w-8 h-8 rounded-lg bg-[#C9A132]/10 border border-[#C9A132]/30 flex items-center justify-center text-sm">📁</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#F5D87A] text-sm font-medium truncate" style={{ fontFamily: 'var(--font-playfair)' }}>{event.name}</p>
                  <p className="text-[#5a4f3a] text-xs mt-0.5">{event._count.photos} foto{event._count.photos !== 1 ? 's' : ''} · todas guardadas en Drive</p>
                </div>
                <a href={event.driveFolderUrl!} target="_blank" rel="noopener noreferrer"
                   className="text-xs text-blue-400 hover:text-blue-300 border border-blue-900/30 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                  Ver en Drive
                </a>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={unlinkDrive}
                  className="border border-[#2B2210] hover:border-red-900/40 text-[#5a4f3a] hover:text-red-500/60 px-4 py-2 rounded-lg text-xs tracking-widest uppercase transition-all"
                >
                  Cambiar carpeta
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Gallery */}
        <div className="card-dark p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[#F5D87A] text-xs tracking-[0.25em] uppercase" style={{ fontFamily: 'var(--font-playfair)' }}>
              Galería · {event.photos.length} foto{event.photos.length !== 1 ? 's' : ''}
            </h2>
            {event.driveFolderUrl && event.photos.length > 0 && (
              <a
                href={event.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 tracking-wide transition-colors"
              >
                Descargar desde Drive ↗
              </a>
            )}
          </div>

          {event.photos.length === 0 ? (
            <div className="text-center py-14 space-y-2">
              <p className="font-script text-4xl text-gold opacity-30" style={{ fontFamily: 'var(--font-great-vibes)' }}>Sin fotos todavía</p>
              <p className="text-[#5a4f3a] text-sm">
                {event.driveFolderId
                  ? 'Compartí el QR para que los invitados empiecen a subir fotos'
                  : 'Configurá Google Drive para empezar a recibir fotos'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {event.photos.map(photo => (
                <a
                  key={photo.id}
                  href={photo.driveFileUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square rounded-xl overflow-hidden bg-[#111] group border border-[#2B2210]"
                >
                  <Image
                    src={photo.path} alt={photo.filename} fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {photo.uploadedBy && (
                    <div className="absolute bottom-0 inset-x-0 text-[#F5D87A] text-xs px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity truncate" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>
                      {photo.uploadedBy}
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
