import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthAdminFull } from '@/lib/auth'
import { createDriveFolder, refreshTokenIfNeeded } from '@/lib/google-drive'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAuthAdminFull()
  if (!admin) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params

  const event = await prisma.event.findFirst({
    where: {
      id,
      ...(admin.isSuperAdmin ? {} : { clientId: admin.id }),
    },
  })

  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  if (!event.googleAccessToken) {
    return NextResponse.json(
      { error: 'No hay cuenta de Google conectada para este evento. Conectala primero.' },
      { status: 400 }
    )
  }

  if (event.driveFolderId) {
    return NextResponse.json({ driveFolderId: event.driveFolderId, driveFolderUrl: event.driveFolderUrl })
  }

  try {
    const freshTokens = await refreshTokenIfNeeded({
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

    const { parentId } = await req.json().catch(() => ({ parentId: undefined }))

    const folderName = `${event.name} — ${new Date(event.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}`
    const folder = await createDriveFolder(freshTokens, folderName, parentId)

    const updated = await prisma.event.update({
      where: { id },
      data: { driveFolderId: folder.id, driveFolderUrl: folder.url },
    })

    return NextResponse.json({ driveFolderId: updated.driveFolderId, driveFolderUrl: updated.driveFolderUrl })
  } catch (err) {
    console.error('Drive folder creation error:', err)
    return NextResponse.json({ error: 'Error al crear la carpeta en Drive.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAuthAdminFull()
  if (!admin) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params

  const event = await prisma.event.findFirst({
    where: {
      id,
      ...(admin.isSuperAdmin ? {} : { clientId: admin.id }),
    },
  })
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  await prisma.event.update({
    where: { id },
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
