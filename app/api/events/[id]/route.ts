import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthAdminFull } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAuthAdminFull()
  if (!admin) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params

  const event = await prisma.event.findFirst({
    where: {
      id,
      ...(admin.isSuperAdmin ? {} : { clientId: admin.id }),
    },
    include: {
      photos: { orderBy: { createdAt: 'asc' } },
      _count: { select: { photos: true } },
      admin: { select: { logoUrl: true } },
      client: { select: { id: true, name: true, email: true, logoUrl: true } },
    },
  })

  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  return NextResponse.json({ event })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  try {
    const body = await req.json()
    const { name, description, date, slideshowInterval, isActive, clientId, nsfwFilter } = body

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(slideshowInterval && { slideshowInterval }),
        // Only super admin can change active status and client assignment
        ...(admin.isSuperAdmin && isActive !== undefined && { isActive }),
        ...(admin.isSuperAdmin && clientId !== undefined && { clientId: clientId || null }),
        ...(nsfwFilter !== undefined && { nsfwFilter }),
      },
    })

    return NextResponse.json({ event: updated })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAuthAdminFull()
  if (!admin) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!admin.isSuperAdmin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await params
  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  await prisma.event.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
