import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthAdmin } from '@/lib/auth'
import { createDriveFolder, refreshTokenIfNeeded } from '@/lib/google-drive'

// POST /api/events/[id]/drive — create Drive folder for the event
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params

  const [event, admin] = await Promise.all([
    prisma.event.findFirst({ where: { id, adminId: auth.id } }),
    prisma.admin.findUnique({ where: { id: auth.id } }),
  ])

  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  if (!admin?.googleAccessToken) {
    return NextResponse.json(
      { error: 'Cuenta de Google no conectada. Conectala desde el dashboard.' },
      { status: 400 }
    )
  }

  if (event.driveFolderId) {
    return NextResponse.json({ driveFolderId: event.driveFolderId, driveFolderUrl: event.driveFolderUrl })
  }

  try {
    // Refresh token if needed
    const freshTokens = await refreshTokenIfNeeded({
      access_token: admin.googleAccessToken,
      refresh_token: admin.googleRefreshToken,
      expiry_date: admin.googleTokenExpiry?.getTime(),
    })

    // Save refreshed tokens if they changed
    if (freshTokens.access_token !== admin.googleAccessToken) {
      await prisma.admin.update({
        where: { id: auth.id },
        data: {
          googleAccessToken: freshTokens.access_token,
          googleRefreshToken: freshTokens.refresh_token ?? undefined,
          googleTokenExpiry: freshTokens.expiry_date ? new Date(freshTokens.expiry_date) : undefined,
        },
      })
    }

    // Create a root "Freedom Fotos" folder if needed, then the event folder inside
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
    return NextResponse.json({ error: 'Error al crear la carpeta en Drive. Verificá que la cuenta de Google tenga acceso.' }, { status: 500 })
  }
}

// DELETE /api/events/[id]/drive — unlink Drive folder
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params

  const event = await prisma.event.findFirst({ where: { id, adminId: auth.id } })
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  await prisma.event.update({
    where: { id },
    data: { driveFolderId: null, driveFolderUrl: null },
  })

  return NextResponse.json({ success: true })
}
