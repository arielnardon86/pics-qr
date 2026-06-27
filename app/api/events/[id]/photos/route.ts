import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadBufferToDrive, refreshTokenIfNeeded } from '@/lib/google-drive'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const event = await prisma.event.findUnique({ where: { id }, select: { id: true } })
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  const photos = await prisma.photo.findMany({
    where: { eventId: id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ photos })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  if (!event.isActive) return NextResponse.json({ error: 'El evento no está activo' }, { status: 403 })
  if (!event.driveFolderId) return NextResponse.json({ error: 'Este evento no tiene Google Drive configurado.' }, { status: 400 })
  if (!event.googleAccessToken) return NextResponse.json({ error: 'Cuenta de Google no conectada para este evento.' }, { status: 400 })

  try {
    const formData = await req.formData()
    const files = formData.getAll('photos') as File[]
    const uploadedBy = formData.get('uploadedBy') as string | null

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se recibieron fotos' }, { status: 400 })
    }

    let freshTokens = await refreshTokenIfNeeded({
      access_token: event.googleAccessToken,
      refresh_token: event.googleRefreshToken,
      expiry_date: event.googleTokenExpiry?.getTime(),
    })

    if (freshTokens.access_token !== event.googleAccessToken) {
      await prisma.event.update({
        where: { id },
        data: {
          googleAccessToken: freshTokens.access_token,
          googleRefreshToken: freshTokens.refresh_token ?? undefined,
          googleTokenExpiry: freshTokens.expiry_date ? new Date(freshTokens.expiry_date) : undefined,
        },
      })
    }

    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg',
      png: 'image/png', gif: 'image/gif',
      webp: 'image/webp', heic: 'image/heic',
    }

    const saved = []

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const mimeType = mimeMap[ext] || 'image/jpeg'
      const buffer = Buffer.from(await file.arrayBuffer())

      const driveFile = await uploadBufferToDrive(freshTokens, event.driveFolderId!, filename, buffer, mimeType)

      const photo = await prisma.photo.create({
        data: {
          eventId: id,
          filename,
          path: driveFile.thumbnailUrl,
          uploadedBy: uploadedBy || null,
          driveFileId: driveFile.id,
          driveFileUrl: driveFile.url,
        },
      })

      saved.push(photo)
    }

    return NextResponse.json({ photos: saved }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al subir fotos' }, { status: 500 })
  }
}
