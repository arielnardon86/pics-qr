'use client'

import { useEffect, useState, useCallback, use, useRef } from 'react'
import Image from 'next/image'
import { getSocket } from '@/lib/socket-client'

interface Photo {
  id: string; path: string; filename: string; uploadedBy: string | null; createdAt: string
}
interface EventData {
  id: string; name: string; slideshowInterval: number; code: string
  admin: { logoUrl: string | null } | null
  client: { logoUrl: string | null } | null
}
interface QRData { qr: string; url: string; code: string }

// Remember the newest photo already shown (by createdAt) so a reload, deploy or
// reconnect resumes with unseen photos instead of replaying the whole event.
const lastShownKey = (eventId: string) => `slideshow:${eventId}:lastShown`
function readLastShown(eventId: string): string | null {
  try { return localStorage.getItem(lastShownKey(eventId)) } catch { return null }
}
function writeLastShown(eventId: string, createdAt: string) {
  try {
    const prev = localStorage.getItem(lastShownKey(eventId))
    if (!prev || createdAt > prev) localStorage.setItem(lastShownKey(eventId), createdAt)
  } catch {}
}

export default function SlideshowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [event, setEvent] = useState<EventData | null>(null)
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [newPhotoFlash, setNewPhotoFlash] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [cycleComplete, setCycleComplete] = useState(false)
  const cycleCompleteRef = useRef(false)
  const photosRef = useRef<Photo[]>([])
  const loadedRef = useRef(false)

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => {
    cycleCompleteRef.current = cycleComplete
  }, [cycleComplete])

  useEffect(() => {
    async function load() {
      const [eventRes, photosRes, qrRes] = await Promise.all([
        fetch(`/api/events/${id}`),
        fetch(`/api/events/${id}/photos`),
        fetch(`/api/events/${id}/qr`),
      ])
      if (eventRes.ok) {
        const data = await eventRes.json()
        setEvent({
          id: data.event.id, name: data.event.name,
          slideshowInterval: data.event.slideshowInterval,
          code: data.event.code,
          admin: data.event.admin ?? null,
          client: data.event.client ?? null,
        })
      }
      if (photosRes.ok) {
        const list: Photo[] = (await photosRes.json()).photos
        photosRef.current = list
        setPhotos(list)
        const lastShown = readLastShown(id)
        const next = lastShown ? list.findIndex(p => p.createdAt > lastShown) : 0
        if (next === -1) {
          // Everything was already shown: go straight to the QR invite screen
          setCurrentIndex(Math.max(0, list.length - 1))
          setCycleComplete(list.length > 0)
        } else {
          setCurrentIndex(next)
        }
      }
      if (qrRes.ok) setQrData(await qrRes.json())
      loadedRef.current = true
      setLoading(false)
    }
    load()
  }, [id])

  // Hide controls after 3s of inactivity
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    function resetTimer() {
      setShowControls(true)
      clearTimeout(timer)
      timer = setTimeout(() => setShowControls(false), 3000)
    }
    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('touchstart', resetTimer)
    resetTimer()
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
    }
  }, [])

  useEffect(() => {
    const socket = getSocket()
    // Rooms are dropped on disconnect, so rejoin after every (re)connect
    function addPhoto(photo: Photo) {
      if (photosRef.current.some(p => p.id === photo.id)) return
      const next = [...photosRef.current, photo]
      photosRef.current = next
      setPhotos(next)
      // On the QR screen: jump straight to the new photo, not back to the last old one
      if (cycleCompleteRef.current) {
        cycleCompleteRef.current = false
        setCurrentIndex(next.length - 1)
        setCycleComplete(false)
      }
      setNewPhotoFlash(true)
      setTimeout(() => setNewPhotoFlash(false), 2000)
    }

    // Photos uploaded while disconnected never reached us — fetch and append them
    async function resync() {
      if (!loadedRef.current) return
      const res = await fetch(`/api/events/${id}/photos`)
      if (!res.ok) return
      const list: Photo[] = (await res.json()).photos
      list.forEach(addPhoto)
    }

    const join = () => socket.emit('join-event', id)
    const onConnect = () => { join(); resync() }
    join()
    socket.on('connect', onConnect)
    socket.on('photo-added', addPhoto)
    socket.on('photo-removed', (photoId: string) => {
      const prev = photosRef.current
      const idx = prev.findIndex(p => p.id === photoId)
      if (idx === -1) return
      photosRef.current = prev.filter(p => p.id !== photoId)
      setPhotos(photosRef.current)
      // Keep showing the same photo if an earlier one was removed; clamp to the new end
      setCurrentIndex(ci => Math.max(0, Math.min(idx < ci ? ci - 1 : ci, prev.length - 2)))
    })
    socket.on('event-updated', (data: { slideshowInterval: number }) => {
      setEvent(e => e ? { ...e, slideshowInterval: data.slideshowInterval } : e)
    })
    return () => { socket.off('photo-added'); socket.off('photo-removed'); socket.off('event-updated'); socket.off('connect', onConnect) }
  }, [id])

  useEffect(() => {
    const photo = photos[currentIndex]
    if (photo && !cycleComplete && !loading) writeLastShown(id, photo.createdAt)
  }, [id, photos, currentIndex, cycleComplete, loading])

  // Advance one step — stops at last photo instead of looping
  const advance = useCallback((total: number) => {
    setCurrentIndex(prev => {
      if (prev + 1 >= total) {
        setCycleComplete(true)
        return prev
      }
      return prev + 1
    })
  }, [])

  useEffect(() => {
    if (isPaused || photos.length === 0 || !event || cycleComplete) return
    const timer = setInterval(() => advance(photos.length), event.slideshowInterval * 1000)
    return () => clearInterval(timer)
  }, [isPaused, photos.length, event, advance, cycleComplete])

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Logo: show client's logo; if no client, show admin's logo; if client has no logo → nothing
  const logoUrl = event?.client
    ? event.client.logoUrl
    : event?.admin?.logoUrl ?? null

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-5xl text-gold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Cargando...</p>
      </div>
    )
  }

  // ── QR invite screen: no photos yet, or all photos shown ──────────────────
  if (photos.length === 0 || cycleComplete) {
    const waiting = photos.length === 0
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#34D399]/5 blur-[100px] pointer-events-none" />

        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="h-20 md:h-28 max-w-[50vw] w-auto object-contain mb-8 opacity-90" style={{ filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.8))' }} />
        )}

        <p className="text-4xl sm:text-5xl text-gold mb-3" style={{ fontFamily: 'var(--font-space-grotesk)', fontStyle: 'italic' }}>
          {event?.name}
        </p>
        <div className="divider-gold w-32 mx-auto mb-8" />

        <p className="text-white text-xl font-semibold tracking-wide mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          ¡Subí tu foto!
        </p>
        <p className="text-[#9ca3af] text-sm mb-8">Escaneá el código QR y compartí tu momento</p>

        {qrData && (
          <div className="bg-white p-4 rounded-2xl shadow-[0_0_60px_rgba(52,211,153,0.15)] mb-6">
            <Image src={qrData.qr} alt="QR" width={220} height={220} className="rounded-xl" />
          </div>
        )}

        <p className="text-[#34D399] font-mono font-bold text-2xl tracking-[0.3em] mb-1">
          {event?.code}
        </p>
        <p className="text-[#6b7280] text-sm tracking-wide">www.totalpics.com.ar</p>

        {waiting ? (
          <p className="mt-10 text-[#6b7280] text-sm tracking-wide" style={{ fontFamily: 'var(--font-space-grotesk)', fontStyle: 'italic' }}>
            Esperando las primeras fotos...
          </p>
        ) : (
        <button
          onClick={() => { setCycleComplete(false); setCurrentIndex(0) }}
          className="mt-10 border border-[#1f2937] hover:border-[#34D399]/40 text-[#34D399]/60 hover:text-white bg-[#080808]/50 hover:bg-[#34D399]/10 rounded-full px-6 py-2.5 text-xs tracking-widest uppercase transition-all"
        >
          ↺ Ver de nuevo
        </button>
        )}
      </div>
    )
  }

  const currentPhoto = photos[currentIndex]

  return (
    <div className="min-h-screen bg-[#080808] relative overflow-hidden select-none">

      {/* Photo */}
      <div className="absolute inset-0">
        <Image
          key={currentPhoto.id}
          src={currentPhoto.path}
          alt={currentPhoto.filename}
          fill
          className="object-contain"
          priority
          sizes="100vw"
        />
      </div>

      {/* Client/admin logo watermark */}
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt="Logo"
          className="absolute top-5 right-[38%] z-30 h-16 md:h-20 max-w-[25vw] w-auto object-contain opacity-85 pointer-events-none"
          style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))' }}
        />
      )}

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-radial-[at_50%_50%] from-transparent via-transparent to-black/40 pointer-events-none" />

      {/* Top bar */}
      <div className={`absolute top-0 inset-x-0 flex items-center justify-between px-8 py-5 z-10 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}
           style={{ background: 'linear-gradient(to bottom, rgba(8,8,8,0.7), transparent)' }}>
        <p className="text-3xl text-gold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          {event?.name}
        </p>
        <div className="flex items-center gap-4">
          {newPhotoFlash && (
            <span className="border border-[#34D399]/50 bg-[#34D399]/10 text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-widest uppercase animate-pulse">
              Nueva foto ✦
            </span>
          )}
          <span className="text-[#9ca3af] text-xs tracking-widest" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            {currentIndex + 1} / {photos.length}
          </span>
          {currentPhoto.uploadedBy && (
            <span className="text-[#34D399]/70 text-sm" style={{ fontFamily: 'var(--font-space-grotesk)', fontStyle: 'italic' }}>
              {currentPhoto.uploadedBy}
            </span>
          )}
        </div>
      </div>

      {/* Left / Right */}
      <button
        onClick={() => { setCurrentIndex(i => (i - 1 + photos.length) % photos.length); setCycleComplete(false) }}
        className={`absolute left-4 top-1/2 -translate-y-1/2 text-[#34D399]/60 hover:text-white bg-[#080808]/40 hover:bg-[#34D399]/10 border border-[#1f2937] hover:border-[#34D399]/40 rounded-full w-12 h-12 flex items-center justify-center text-2xl transition-all z-10 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >‹</button>
      <button
        onClick={() => advance(photos.length)}
        className={`absolute right-4 top-1/2 -translate-y-1/2 text-[#34D399]/60 hover:text-white bg-[#080808]/40 hover:bg-[#34D399]/10 border border-[#1f2937] hover:border-[#34D399]/40 rounded-full w-12 h-12 flex items-center justify-center text-2xl transition-all z-10 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >›</button>

      {/* Bottom controls */}
      <div className={`absolute bottom-0 inset-x-0 flex items-center justify-center gap-4 px-6 py-6 z-10 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}
           style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.7), transparent)' }}>
        <button
          onClick={() => setIsPaused(p => !p)}
          className="border border-[#1f2937] hover:border-[#34D399]/40 text-[#34D399]/70 hover:text-white bg-[#080808]/50 hover:bg-[#34D399]/10 rounded-full px-5 py-2 text-xs tracking-widest uppercase transition-all"
        >
          {isPaused ? '▶ Reanudar' : '⏸ Pausar'}
        </button>
        <button
          onClick={toggleFullscreen}
          className="border border-[#1f2937] hover:border-[#34D399]/40 text-[#34D399]/70 hover:text-white bg-[#080808]/50 hover:bg-[#34D399]/10 rounded-full px-5 py-2 text-xs tracking-widest uppercase transition-all"
        >
          {isFullscreen ? 'Salir' : 'Pantalla completa'}
        </button>
      </div>

      {/* Gold progress bar */}
      {!isPaused && event && (
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-[#1f2937] z-20">
          <div
            key={`${currentIndex}-${event.slideshowInterval}`}
            className="h-full"
            style={{
              background: 'linear-gradient(90deg, #7A5C10, #34D399, #34D399)',
              animation: `progress ${event.slideshowInterval}s linear`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes progress { from { width: 0% } to { width: 100% } }
      `}</style>
    </div>
  )
}
