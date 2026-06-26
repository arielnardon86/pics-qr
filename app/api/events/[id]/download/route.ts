import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthAdmin } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params

  const event = await prisma.event.findFirst({
    where: { id, adminId: auth.id },
    select: { driveFolderUrl: true },
  })

  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  if (!event.driveFolderUrl) return NextResponse.json({ error: 'No hay carpeta de Drive configurada' }, { status: 404 })

  return NextResponse.json({ driveUrl: event.driveFolderUrl })
}
