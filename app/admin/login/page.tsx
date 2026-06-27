'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Credenciales inválidas')
      else router.push('/admin/dashboard')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#C9A132]/6 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center space-y-1">
          <Link href="/">
            <p className="font-script text-6xl text-gold leading-none"
               style={{ fontFamily: 'var(--font-great-vibes)' }}>
              Freedom
            </p>
          </Link>
          <p className="text-[#C9A132]/60 text-xs tracking-[0.4em] uppercase"
             style={{ fontFamily: 'var(--font-playfair)' }}>
            Fotos
          </p>
          <div className="divider-gold mx-auto w-32 mt-3" />
        </div>

        {/* Card */}
        <div className="card-dark p-8 glow-gold space-y-6">
          <h2 className="text-center text-[#F5D87A] text-lg tracking-[0.2em] uppercase"
              style={{ fontFamily: 'var(--font-playfair)' }}>
            Administrador
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#C9A132]/70 mb-1.5 tracking-widest uppercase">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input-dark"
                placeholder="admin@ejemplo.com"
              />
            </div>
            <div>
              <label className="block text-xs text-[#C9A132]/70 mb-1.5 tracking-widest uppercase">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input-dark"
                placeholder="••••••••"
              />
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
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
