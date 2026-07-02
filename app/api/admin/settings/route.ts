import { NextRequest, NextResponse } from 'next/server'
import { getAuthAdminFull } from '@/lib/auth'
import { getSettings, setSetting } from '@/lib/settings'

const KEYS = ['event_price', 'upload_hours_before', 'upload_hours_after']

export async function GET() {
  const admin = await getAuthAdminFull()
  if (!admin?.isSuperAdmin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const settings = await getSettings(KEYS)
  return NextResponse.json({ settings })
}

export async function PUT(req: NextRequest) {
  const admin = await getAuthAdminFull()
  if (!admin?.isSuperAdmin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json()

  for (const key of KEYS) {
    if (body[key] !== undefined) {
      const num = Number(body[key])
      if (isNaN(num) || num < 0) return NextResponse.json({ error: `Valor inválido para ${key}` }, { status: 400 })
      await setSetting(key, String(num))
    }
  }

  const settings = await getSettings(KEYS)
  return NextResponse.json({ settings })
}
