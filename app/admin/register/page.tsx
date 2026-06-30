'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, name: form.name || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al registrarse')
        return
      }

      // Cookie is now set — upload logo if selected
      if (logoFile) {
        const fd = new FormData()
        fd.append('logo', logoFile)
        await fetch('/api/admin/logo', { method: 'POST', body: fd })
      }

      router.push('/admin/dashboard')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#34D399]/6 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center space-y-3">
          <Link href="/" className="flex flex-col items-center gap-2">
            <Image src="/logo.png" alt="Total Pics" width={64} height={64} unoptimized className="drop-shadow-[0_0_16px_rgba(52,211,153,0.3)]" />
            <p className="text-xl font-black tracking-widest uppercase text-white" style={{ fontFamily: 'var(--font-exo2)' }}>
              TOTAL <span className="text-[#34D399]">PICS</span>
            </p>
          </Link>
          <div className="divider-gold mx-auto w-32" />
        </div>

        {/* Card */}
        <div className="card-dark p-8 glow-gold space-y-6">
          <div className="text-center">
            <h2 className="text-white text-lg tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Crear cuenta
            </h2>
            <p className="text-[#6b7280] text-xs mt-1 tracking-wide">Organizá eventos y gestioná fotos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#34D399]/70 mb-1.5 tracking-widest uppercase">
                Nombre / Razón social
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input-dark"
                placeholder="Tu nombre o empresa"
              />
            </div>

            <div>
              <label className="block text-xs text-[#34D399]/70 mb-1.5 tracking-widest uppercase">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input-dark"
                placeholder="vos@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-xs text-[#34D399]/70 mb-1.5 tracking-widest uppercase">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input-dark"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-xs text-[#34D399]/70 mb-1.5 tracking-widest uppercase">
                Repetir contraseña
              </label>
              <input
                type="password"
                required
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                className="input-dark"
                placeholder="••••••••"
              />
            </div>

            {/* Logo opcional */}
            <div>
              <label className="block text-xs text-[#34D399]/70 mb-1.5 tracking-widest uppercase">
                Logo de tu marca <span className="text-[#374151] normal-case not-uppercase">(opcional)</span>
              </label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-reg-input"
              />
              <label
                htmlFor="logo-reg-input"
                className="flex items-center gap-3 cursor-pointer border border-[#1f2937] hover:border-[#34D399]/30 rounded-xl px-4 py-3 transition-colors group"
              >
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="Logo preview" className="w-10 h-10 object-contain rounded-lg bg-[#0f172a] p-1" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#0f172a] border border-[#1f2937] flex items-center justify-center text-[#374151] group-hover:border-[#34D399]/20 transition-colors">
                    ✦
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white text-xs font-medium truncate">
                    {logoFile ? logoFile.name : 'Subir logo'}
                  </p>
                  <p className="text-[#6b7280] text-[10px] mt-0.5">PNG con fondo transparente recomendado</p>
                </div>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={e => { e.preventDefault(); setLogoFile(null); setLogoPreview(null); if (logoInputRef.current) logoInputRef.current.value = '' }}
                    className="ml-auto text-[#374151] hover:text-red-500/70 text-xs transition-colors shrink-0"
                  >
                    ✕
                  </button>
                )}
              </label>
            </div>

            {error && (
              <div className="border border-red-900/50 bg-red-900/10 text-red-400 rounded-xl px-4 py-3 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3 rounded-xl text-sm tracking-widest uppercase mt-2"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#6b7280] text-xs tracking-wide">
          ¿Ya tenés cuenta?{' '}
          <Link href="/admin/login" className="text-[#34D399]/70 hover:text-[#34D399] transition-colors">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  )
}
