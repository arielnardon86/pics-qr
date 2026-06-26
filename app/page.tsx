import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080808] flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Background subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#C9A132]/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-10">

        {/* Logo / Brand */}
        <div className="space-y-2">
          <p className="font-script text-7xl sm:text-8xl text-gold tracking-wide leading-none"
             style={{ fontFamily: 'var(--font-great-vibes)' }}>
            Freedom
          </p>
          <p className="font-serif-display text-xs tracking-[0.45em] uppercase text-[#C9A132]/70"
             style={{ fontFamily: 'var(--font-playfair)' }}>
            Fotos
          </p>
          {/* Reflection */}
          <div className="relative h-8 overflow-hidden">
            <p className="font-script text-4xl text-gold opacity-20 scale-y-[-1] origin-top leading-none"
               style={{ fontFamily: 'var(--font-great-vibes)', filter: 'blur(1px)' }}>
              Freedom
            </p>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#080808]" />
          </div>
        </div>

        <div className="divider-gold mx-auto w-48" />

        <p className="text-[#C9A132]/80 text-lg leading-relaxed"
           style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>
          Compartí y proyectá los momentos más especiales de tu evento en tiempo real
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {[
            { icon: '✦', title: 'Creá tu evento', desc: 'Casamientos, 15 años, fiestas y más' },
            { icon: '✦', title: 'Invitados suben fotos', desc: 'Solo escanean el QR o usan el link' },
            { icon: '✦', title: 'Proyectá en vivo', desc: 'Slideshow automático con tus fotos' },
          ].map(f => (
            <div
              key={f.title}
              className="card-dark p-5 space-y-2"
              style={{ borderColor: '#2B2210' }}
            >
              <span className="text-gold text-lg" style={{ fontFamily: 'var(--font-playfair)' }}>{f.icon}</span>
              <h3 className="font-semibold text-[#F5D87A] text-sm tracking-wide uppercase"
                  style={{ fontFamily: 'var(--font-playfair)', letterSpacing: '0.1em' }}>
                {f.title}
              </h3>
              <p className="text-[#8a7a5a] text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Link href="/admin/login" className="btn-gold px-10 py-4 rounded-xl text-sm tracking-widest uppercase">
            Panel de administrador
          </Link>
        </div>

        <p className="text-[#5a4f3a] text-xs tracking-wider">
          ¿Sos invitado? Escaneá el QR del evento o pedile el link al organizador.
        </p>
      </div>
    </main>
  )
}
