import { NextRequest, NextResponse } from 'next/server'
import { getAuthAdmin } from '@/lib/auth'
import { getAuthUrl } from '@/lib/google-drive'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Google OAuth no configurado' },
      { status: 503 }
    )
  }

  const eventId = new URL(req.url).searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'eventId requerido' }, { status: 400 })

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } })
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  return NextResponse.redirect(getAuthUrl(eventId))
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const eventId = new URL(req.url).searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'eventId requerido' }, { status: 400 })

  await prisma.event.update({
    where: { id: eventId },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
      driveFolderId: null,
      driveFolderUrl: null,
    },
  })

  return NextResponse.json({ success: true })
}
