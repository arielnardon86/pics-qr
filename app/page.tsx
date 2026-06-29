import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 relative overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#34D399]/6 blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-[#14B8A6]/4 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-10">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logo.png"
            alt="Total Pics"
            width={120}
            height={120}
            className="drop-shadow-[0_0_24px_rgba(52,211,153,0.3)]"
            priority
          />
          <div>
            <p className="text-4xl sm:text-5xl font-black tracking-widest uppercase text-white" style={{ fontFamily: 'var(--font-exo2)' }}>
              TOTAL <span className="text-[#34D399]">PICS</span>
            </p>
            <p className="text-xs tracking-[0.4em] uppercase text-[#34D399]/60 mt-1">Tus momentos, en grande</p>
          </div>
        </div>

        <div className="divider-gold mx-auto w-48" />

        <p className="text-[#9ca3af] text-lg leading-relaxed">
          Compartí y proyectá los momentos más especiales de tu evento en tiempo real
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {[
            { num: '01', title: 'Creá tu evento', desc: 'Casamientos, 15 años, fiestas y más' },
            { num: '02', title: 'Invitados suben fotos', desc: 'Solo escanean el QR o usan el link' },
            { num: '03', title: 'Proyectá en vivo', desc: 'Slideshow automático con tus fotos' },
          ].map(f => (
            <div key={f.title} className="card-dark p-5 space-y-3 hover:border-[#34D399]/30 transition-colors">
              <span className="text-[#34D399]/40 text-xs font-bold tracking-widest" style={{ fontFamily: 'var(--font-exo2)' }}>{f.num}</span>
              <h3 className="font-bold text-white text-sm tracking-wide uppercase" style={{ fontFamily: 'var(--font-exo2)' }}>
                {f.title}
              </h3>
              <p className="text-[#6b7280] text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Link href="/admin/login" className="btn-gold px-10 py-4 rounded-xl text-sm tracking-widest uppercase font-bold">
            Panel de administrador
          </Link>
        </div>

        <p className="text-[#374151] text-xs tracking-wider">
          ¿Sos invitado? Escaneá el QR del evento o pedile el link al organizador.
        </p>
      </div>
    </main>
  )
}
