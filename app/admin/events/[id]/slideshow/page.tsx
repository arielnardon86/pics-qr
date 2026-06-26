'use client'

import { useEffect, useState, useCallback, use } from 'react'
import Image from 'next/image'
import { getSocket } from '@/lib/socket-client'

interface Photo {
  id: string; path: string; filename: string; uploadedBy: string | null; createdAt: string
}
interface EventData {
  id: string; name: string; slideshowInterval: number
}

export default function SlideshowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [event, setEvent] = useState<EventData | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [newPhotoFlash, setNewPhotoFlash] = useState(false)
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    async function load() {
      const [eventRes, photosRes] = await Promise.all([
        fetch(`/api/events/${id}`),
        fetch(`/api/events/${id}/photos`),
      ])
      if (eventRes.ok) {
        const data = await eventRes.json()
        setEvent({ id: data.event.id, name: data.event.name, slideshowInterval: data.event.slideshowInterval })
      }
      if (photosRes.ok) setPhotos((await photosRes.json()).photos)
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
    socket.emit('join-event', id)
    socket.on('photo-added', (photo: Photo) => {
      setPhotos(prev => [...prev, photo])
      setNewPhotoFlash(true)
      setTimeout(() => setNewPhotoFlash(false), 2000)
    })
    return () => { socket.off('photo-added') }
  }, [id])

  const advance = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % Math.max(photos.length, 1))
  }, [photos.length])

  useEffect(() => {
    if (isPaused || photos.length <= 1 || !event) return
    const timer = setInterval(advance, event.slideshowInterval * 1000)
    return () => clearInterval(timer)
  }, [isPaused, photos.length, event, advance])

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="font-script text-5xl text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>
          Cargando...
        </p>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center text-center p-8 space-y-6">
        <p className="font-script text-7xl text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>
          {event?.name}
        </p>
        <div className="divider-gold w-48 mx-auto" />
        <p className="text-[#8a7a5a] text-lg tracking-wide" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>
          Esperando las primeras fotos...
        </p>
        <p className="text-[#5a4f3a] text-sm">Las fotos aparecerán aquí en tiempo real</p>
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

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-radial-[at_50%_50%] from-transparent via-transparent to-black/40 pointer-events-none" />

      {/* Top bar */}
      <div className={`absolute top-0 inset-x-0 flex items-center justify-between px-8 py-5 z-10 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}
           style={{ background: 'linear-gradient(to bottom, rgba(8,8,8,0.7), transparent)' }}>
        <p className="font-script text-3xl text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>
          {event?.name}
        </p>
        <div className="flex items-center gap-4">
          {newPhotoFlash && (
            <span className="border border-[#C9A132]/50 bg-[#C9A132]/10 text-[#F5D87A] text-xs font-bold px-3 py-1.5 rounded-full tracking-widest uppercase animate-pulse">
              Nueva foto ✦
            </span>
          )}
          <span className="text-[#8a7a5a] text-xs tracking-widest" style={{ fontFamily: 'var(--font-playfair)' }}>
            {currentIndex + 1} / {photos.length}
          </span>
          {currentPhoto.uploadedBy && (
            <span className="text-[#C9A132]/70 text-sm" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>
              {currentPhoto.uploadedBy}
            </span>
          )}
        </div>
      </div>

      {/* Left / Right */}
      <button
        onClick={() => setCurrentIndex(i => (i - 1 + photos.length) % photos.length)}
        className={`absolute left-4 top-1/2 -translate-y-1/2 text-[#C9A132]/60 hover:text-[#F5D87A] bg-[#080808]/40 hover:bg-[#C9A132]/10 border border-[#2B2210] hover:border-[#C9A132]/40 rounded-full w-12 h-12 flex items-center justify-center text-2xl transition-all z-10 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        ‹
      </button>
      <button
        onClick={() => setCurrentIndex(i => (i + 1) % photos.length)}
        className={`absolute right-4 top-1/2 -translate-y-1/2 text-[#C9A132]/60 hover:text-[#F5D87A] bg-[#080808]/40 hover:bg-[#C9A132]/10 border border-[#2B2210] hover:border-[#C9A132]/40 rounded-full w-12 h-12 flex items-center justify-center text-2xl transition-all z-10 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        ›
      </button>

      {/* Bottom controls */}
      <div className={`absolute bottom-0 inset-x-0 flex items-center justify-center gap-4 px-6 py-6 z-10 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}
           style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.7), transparent)' }}>
        <button
          onClick={() => setIsPaused(p => !p)}
          className="border border-[#2B2210] hover:border-[#C9A132]/40 text-[#C9A132]/70 hover:text-[#F5D87A] bg-[#080808]/50 hover:bg-[#C9A132]/10 rounded-full px-5 py-2 text-xs tracking-widest uppercase transition-all"
        >
          {isPaused ? '▶ Reanudar' : '⏸ Pausar'}
        </button>
        <button
          onClick={toggleFullscreen}
          className="border border-[#2B2210] hover:border-[#C9A132]/40 text-[#C9A132]/70 hover:text-[#F5D87A] bg-[#080808]/50 hover:bg-[#C9A132]/10 rounded-full px-5 py-2 text-xs tracking-widest uppercase transition-all"
        >
          {isFullscreen ? 'Salir' : 'Pantalla completa'}
        </button>
      </div>

      {/* Gold progress bar */}
      {!isPaused && event && (
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-[#2B2210] z-20">
          <div
            key={`${currentIndex}-${event.slideshowInterval}`}
            className="h-full"
            style={{
              background: 'linear-gradient(90deg, #7A5C10, #C9A132, #F5D87A)',
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
