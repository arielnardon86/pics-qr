import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthAdminFull } from '@/lib/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const admin = await getAuthAdminFull()
  if (!admin) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id, photoId } = await params

  // Verify admin has access to this event
  const event = await prisma.event.findFirst({
    where: { id, ...(admin.isSuperAdmin ? {} : { clientId: admin.id }) },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  const photo = await prisma.photo.findFirst({ where: { id: photoId, eventId: id } })
  if (!photo) return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 })

  await prisma.photo.delete({ where: { id: photoId } })
  return NextResponse.json({ success: true })
}
