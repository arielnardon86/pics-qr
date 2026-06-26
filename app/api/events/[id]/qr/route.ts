import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthAdmin } from '@/lib/auth'
import QRCode from 'qrcode'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const event = await prisma.event.findFirst({
    where: { id, adminId: auth.id },
  })

  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const url = `${baseUrl}/e/${event.code}`

  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  })

  return NextResponse.json({ qr: qrDataUrl, url, code: event.code })
}
