'use client'

import { useEffect, useState, useRef, use } from 'react'
import { getSocket } from '@/lib/socket-client'

interface EventData {
  id: string; name: string; description: string | null; date: string; code: string; isActive: boolean
}

export default function GuestPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [uploaderName, setUploaderName] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/public/${code}`)
      if (!res.ok) setNotFound(true)
      else setEvent((await res.json()).event)
      setLoading(false)
    }
    load()
  }, [code])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'))
    setSelectedFiles(prev => [...prev, ...files])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
  }

  function removeFile(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function handleUpload() {
    if (!event || selectedFiles.length === 0) return
    setUploading(true); setError('')
    try {
      const formData = new FormData()
      selectedFiles.forEach(file => formData.append('photos', file))
      if (uploaderName.trim()) formData.append('uploadedBy', uploaderName.trim())
      const res = await fetch(`/api/events/${event.id}/photos`, { method: 'POST', body: formData })
      if (!res.ok) {
        setError((await res.json()).error || 'Error al subir las fotos')
      } else {
        const data = await res.json()
        const socket = getSocket()
        data.photos.forEach((photo: object) => socket.emit('new-photo', { eventId: event.id, photo }))
        setSuccess(true)
        setSelectedFiles([]); setPreviews([])
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="font-script text-5xl text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>
          Cargando...
        </p>
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
        <div className="card-dark p-10 text-center max-w-sm w-full glow-gold space-y-4">
          <p className="font-script text-5xl text-gold opacity-50" style={{ fontFamily: 'var(--font-great-vibes)' }}>
            Oops...
          </p>
          <p className="text-[#F5D87A] text-sm tracking-wide" style={{ fontFamily: 'var(--font-playfair)' }}>
            Evento no encontrado
          </p>
          <p className="text-[#5a4f3a] text-xs">
            El código <span className="font-mono text-[#C9A132]">{code}</span> no corresponde a ningún evento activo.
          </p>
        </div>
      </div>
    )
  }

  // ── Inactive ─────────────────────────────────────────────────────────────
  if (!event.isActive) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
        <div className="card-dark p-10 text-center max-w-sm w-full glow-gold space-y-4">
          <p className="font-script text-5xl text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>{event.name}</p>
          <div className="divider-gold mx-auto w-24" />
          <p className="text-[#8a7a5a] text-sm" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>
            Este evento ya no está recibiendo fotos.
          </p>
        </div>
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#C9A132]/8 blur-[100px] pointer-events-none" />
        <div className="relative z-10 card-dark p-10 text-center max-w-sm w-full glow-gold space-y-5">
          <p className="font-script text-6xl text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>
            ¡Gracias!
          </p>
          <div className="divider-gold mx-auto w-32" />
          <p className="text-[#F5D87A] text-sm tracking-wide" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>
            Tus fotos ya están en el slideshow del evento
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="btn-gold w-full py-3 rounded-xl text-xs tracking-widest uppercase mt-2"
          >
            Subir más fotos
          </button>
        </div>
      </div>
    )
  }

  // ── Upload form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center py-10 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-[#C9A132]/5 blur-[120px] pointer-events-none" />

      {/* Brand header */}
      <div className="relative z-10 text-center mb-8 space-y-1">
        <p className="font-script text-6xl text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>
          Freedom
        </p>
        <p className="text-[#C9A132]/50 text-xs tracking-[0.4em] uppercase" style={{ fontFamily: 'var(--font-playfair)' }}>
          Fotos
        </p>
      </div>

      {/* Event name */}
      <div className="relative z-10 text-center mb-6 space-y-2">
        <h1 className="text-[#F5D87A] text-xl" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>
          {event.name}
        </h1>
        {event.description && <p className="text-[#8a7a5a] text-sm">{event.description}</p>}
        <p className="text-[#5a4f3a] text-xs tracking-wide">
          {new Date(event.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <div className="divider-gold mx-auto w-32 mt-1" />
      </div>

      {/* Form card */}
      <div className="relative z-10 card-dark p-6 w-full max-w-md glow-gold space-y-5">

        {/* Name input */}
        <div>
          <label className="block text-xs text-[#C9A132]/60 mb-1.5 tracking-widest uppercase">
            Tu nombre (opcional)
          </label>
          <input
            type="text"
            value={uploaderName}
            onChange={e => setUploaderName(e.target.value)}
            className="input-dark text-sm"
            placeholder="¿Cómo te llamás?"
          />
        </div>

        {/* File picker */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="flex flex-col items-center justify-center border-2 border-dashed border-[#2B2210] hover:border-[#C9A132]/50 rounded-2xl p-6 cursor-pointer transition-colors hover:bg-[#C9A132]/5 group"
          >
            <span className="text-gold text-2xl mb-2 group-hover:scale-110 transition-transform" style={{ fontFamily: 'var(--font-playfair)' }}>✦</span>
            <p className="text-[#F5D87A] text-sm font-medium tracking-wide" style={{ fontFamily: 'var(--font-playfair)' }}>
              Seleccionar fotos
            </p>
            <p className="text-[#5a4f3a] text-xs mt-1">Podés elegir varias a la vez</p>
          </label>
        </div>

        {/* Previews */}
        {previews.length > 0 && (
          <div>
            <p className="text-xs text-[#C9A132]/60 mb-2 tracking-widest uppercase">
              {selectedFiles.length} foto{selectedFiles.length !== 1 ? 's' : ''} seleccionada{selectedFiles.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#111] group border border-[#2B2210]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-[#080808]/80 border border-[#2B2210] text-[#C9A132] rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="border border-red-900/40 bg-red-900/10 text-red-400 rounded-xl px-4 py-3 text-sm text-center">
            {error}
          </div>
        )}

        <div className="divider-gold opacity-30" />

        <button
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          className="btn-gold w-full py-4 rounded-2xl text-sm tracking-widest uppercase"
        >
          {uploading
            ? 'Subiendo...'
            : selectedFiles.length > 0
              ? `Subir ${selectedFiles.length} foto${selectedFiles.length !== 1 ? 's' : ''}`
              : 'Subir fotos'}
        </button>
      </div>

      <p className="relative z-10 text-[#3a3020] text-xs tracking-wider mt-6">
        Freedom Fotos · {event.code}
      </p>
    </div>
  )
}
