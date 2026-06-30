'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, CloudUpload, Monitor, Heart } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [code, setCode] = useState('')

  function handleScan(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed) router.push(`/e/${trimmed}`)
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col overflow-hidden">

      {/* ── NAV ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-12 py-5 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Total Pics" width={36} height={36} unoptimized className="drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]" />
          <span className="font-black tracking-widest uppercase text-white text-sm" style={{ fontFamily: 'var(--font-exo2)' }}>
            TOTAL <span className="text-[#34D399]">PICS</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <a href="#como-funciona" className="text-[#9ca3af] hover:text-white text-xs tracking-widest uppercase transition-colors hidden sm:block">
            Cómo funciona
          </a>
          <span className="text-[#6b7280] text-xs hidden md:block">¿Sos organizador de eventos?</span>
          <Link href="/admin/register" className="text-[#9ca3af] hover:text-white text-xs tracking-widest uppercase transition-colors border border-[#1f2937] hover:border-[#34D399]/40 px-4 py-2 rounded-lg">
            Registrate
          </Link>
          <Link href="/admin/login" className="btn-gold px-5 py-2 rounded-lg text-xs tracking-widest uppercase font-bold">
            Ingresá
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex-1 flex items-center overflow-hidden min-h-[85vh]">

        {/* Hero photo background */}
        <div className="absolute inset-0">
          <Image
            src="/hero.jpg"
            alt="Evento Total Pics"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Overlay: dark left for text, fade to transparent right */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/92 via-[#09090b]/70 to-[#09090b]/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/80 via-transparent to-[#09090b]/50" />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-12 py-20">
          <div className="max-w-lg space-y-6">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase leading-[1.05] text-white" style={{ fontFamily: 'var(--font-exo2)' }}>
              COMPARTÍ<br />TUS FOTOS.<br />
              <span className="text-[#34D399]">REVIVÍ<br />EL MOMENTO.</span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg max-w-sm leading-relaxed">
              Escaneá el QR, subí tus fotos y mirálas en pantalla durante todo el evento.
            </p>

            <form onSubmit={handleScan} className="flex gap-3 max-w-sm pt-2">
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Código del evento"
                className="input-dark flex-1 text-sm uppercase tracking-widest font-bold placeholder:normal-case placeholder:tracking-normal placeholder:font-normal"
              />
              <button type="submit" className="btn-gold px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold flex items-center gap-2 whitespace-nowrap">
                <QrCode size={14} strokeWidth={2} />
                Ir
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section id="como-funciona" className="relative z-10 px-6 sm:px-12 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-xs tracking-[0.4em] uppercase text-[#34D399]/70 mb-2 font-semibold" style={{ fontFamily: 'var(--font-exo2)' }}>
            Cómo funciona
          </h2>
          <p className="text-center text-2xl sm:text-3xl font-black uppercase text-white mb-10" style={{ fontFamily: 'var(--font-exo2)' }}>
            ¿CÓMO FUNCIONA?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: QrCode,      title: 'Escaneá el QR',       desc: 'Ingresá desde tu celular escaneando el código del evento.' },
              { icon: CloudUpload, title: 'Subí tu foto',         desc: 'Elegí tu mejor foto y subila al álbum del evento.' },
              { icon: Monitor,     title: 'Se muestra en vivo',   desc: 'Tus fotos se ven en la pantalla durante todo el evento.' },
              { icon: Heart,       title: 'Reviví los recuerdos', desc: 'Todas las fotos quedan guardadas para compartir después.' },
            ].map(step => (
              <div key={step.title} className="card-dark p-6 space-y-3 hover:border-[#34D399]/25 transition-colors text-center">
                <div className="w-12 h-12 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 flex items-center justify-center mx-auto">
                  <step.icon size={22} className="text-[#34D399]" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-white text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-exo2)' }}>{step.title}</h3>
                <p className="text-[#6b7280] text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 px-6 py-5 text-center">
        <p className="text-[#374151] text-xs tracking-widest">
          TOTAL PICS · Tus momentos, en grande
        </p>
      </footer>
    </div>
  )
}
