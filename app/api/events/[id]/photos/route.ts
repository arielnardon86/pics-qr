import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadBufferToDrive, refreshTokenIfNeeded } from '@/lib/google-drive'
import { isSafeImage } from '@/lib/nsfw'

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

  const now = Date.now()
  const eventTime = new Date(event.date).getTime()
  if (now < eventTime - 24 * 60 * 60 * 1000)
    return NextResponse.json({ error: 'El evento aún no comenzó' }, { status: 403 })
  if (now > eventTime + 48 * 60 * 60 * 1000)
    return NextResponse.json({ error: 'El evento ya finalizó' }, { status: 403 })
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

    // Read all buffers in parallel
    const imageFiles = await Promise.all(
      files
        .filter(f => f.type.startsWith('image/'))
        .map(async file => {
          const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
          return {
            buffer: Buffer.from(await file.arrayBuffer()),
            ext,
            mimeType: mimeMap[ext] || 'image/jpeg',
          }
        })
    )

    // Run NSFW checks in parallel
    const safeFlags = await Promise.all(imageFiles.map(({ buffer }) => isSafeImage(buffer)))
    const safeImages = imageFiles.filter((_, i) => {
      if (!safeFlags[i]) console.warn('[nsfw] imagen rechazada')
      return safeFlags[i]
    })

    if (safeImages.length === 0) {
      return NextResponse.json({ error: 'Las fotos no cumplen con las políticas de contenido del evento.' }, { status: 422 })
    }

    // Upload safe images to Drive in parallel
    const saved = await Promise.all(
      safeImages.map(async ({ buffer, ext, mimeType }) => {
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const driveFile = await uploadBufferToDrive(freshTokens, event.driveFolderId!, filename, buffer, mimeType)
        return prisma.photo.create({
          data: {
            eventId: id,
            filename,
            path: driveFile.thumbnailUrl,
            uploadedBy: uploadedBy || null,
            driveFileId: driveFile.id,
            driveFileUrl: driveFile.url,
          },
        })
      })
    )

    return NextResponse.json({ photos: saved }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al subir fotos' }, { status: 500 })
  }
}
