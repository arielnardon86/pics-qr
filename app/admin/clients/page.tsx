'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ClientEvent { id: string; name: string; isActive: boolean }
interface Client { id: string; email: string; name: string; createdAt: string; clientEvents: ClientEvent[] }

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/clients')
      if (res.status === 401) { router.push('/admin/login'); return }
      if (res.status === 403) { router.push('/admin/dashboard'); return }
      if (res.ok) setClients((await res.json()).clients)
      setLoading(false)
    }
    load()
  }, [router])

  async function createClient(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCreating(true)
    const res = await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Error al crear cliente')
    } else {
      setClients(prev => [{ ...data.client, createdAt: new Date().toISOString(), clientEvents: [] }, ...prev])
      setForm({ name: '', email: '', password: '' })
      setShowForm(false)
      showToast(`Cliente ${data.client.name} creado ✓`)
    }
    setCreating(false)
  }

  async function deleteClient(id: string, name: string) {
    if (!confirm(`¿Eliminar el cliente "${name}"? Sus eventos quedarán sin asignar.`)) return
    const res = await fetch(`/api/admin/clients/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setClients(prev => prev.filter(c => c.id !== id))
      showToast(`Cliente ${name} eliminado`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-3xl text-gold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium tracking-wide border ${
          toast.type === 'ok' ? 'bg-[#34D399]/10 border-[#34D399]/40 text-white' : 'bg-red-900/20 border-red-800/40 text-red-400'
        }`}>{toast.msg}</div>
      )}

      <header className="border-b border-[#1f2937] bg-[#080808]/95 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-[#34D399]/50 hover:text-[#34D399] text-xs tracking-widest uppercase transition-colors">← Dashboard</Link>
            <div className="w-px h-4 bg-[#1f2937]" />
            <h1 className="text-white text-sm tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Clientes</h1>
          </div>
          <button
            onClick={() => { setShowForm(true); setError('') }}
            className="btn-gold px-5 py-2 rounded-lg text-xs tracking-widest uppercase"
          >
            + Nuevo cliente
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">

        {/* Create client form */}
        {showForm && (
          <div className="card-dark p-6 glow-gold">
            <h2 className="text-white text-xs tracking-[0.25em] uppercase mb-5" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Nuevo cliente</h2>
            <form onSubmit={createClient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[#34D399]/60 mb-1.5 tracking-widest uppercase">Nombre</label>
                  <input
                    type="text" required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="input-dark text-sm" placeholder="Juan García"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#34D399]/60 mb-1.5 tracking-widest uppercase">Email</label>
                  <input
                    type="email" required value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="input-dark text-sm" placeholder="juan@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#34D399]/60 mb-1.5 tracking-widest uppercase">Contraseña</label>
                  <input
                    type="password" required minLength={6} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="input-dark text-sm" placeholder="••••••••"
                  />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs text-[#9ca3af] hover:text-[#34D399] tracking-widest uppercase transition-colors">Cancelar</button>
                <button type="submit" disabled={creating} className="btn-gold px-6 py-2 rounded-lg text-xs tracking-widest uppercase disabled:opacity-50">
                  {creating ? 'Creando...' : 'Crear cliente'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Clients list */}
        {clients.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <p className="text-5xl text-gold opacity-40" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Sin clientes</p>
            <p className="text-[#6b7280] text-sm">Creá el primer cliente para empezar a vender el servicio</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map(client => (
              <div key={client.id} className="card-dark p-5" style={{ borderColor: '#1f2937' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{client.name}</p>
                    <p className="text-[#9ca3af] text-xs mt-0.5">{client.email}</p>
                  </div>
                  <button
                    onClick={() => deleteClient(client.id, client.name)}
                    className="text-xs text-[#6b7280] hover:text-red-500/70 hover:bg-red-900/10 px-3 py-1.5 rounded-lg transition-colors tracking-widest uppercase"
                  >
                    Eliminar
                  </button>
                </div>

                {client.clientEvents.length > 0 && (
                  <>
                    <div className="divider-gold opacity-20 my-3" />
                    <div className="flex flex-wrap gap-2">
                      {client.clientEvents.map(ev => (
                        <Link
                          key={ev.id}
                          href={`/admin/events/${ev.id}`}
                          className="text-xs px-3 py-1 rounded-full border border-[#1f2937] hover:border-[#34D399]/40 text-[#9ca3af] hover:text-[#34D399] transition-colors"
                        >
                          {ev.name} {ev.isActive ? '·' : '· inactivo'}
                        </Link>
                      ))}
                    </div>
                  </>
                )}

                {client.clientEvents.length === 0 && (
                  <p className="text-[#374151] text-xs mt-2">Sin eventos asignados</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
