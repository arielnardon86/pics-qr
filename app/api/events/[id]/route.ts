import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthAdmin } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const event = await prisma.event.findFirst({
    where: { id, adminId: auth.id },
    include: {
      photos: { orderBy: { createdAt: 'asc' } },
      _count: { select: { photos: true } },
    },
  })

  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  return NextResponse.json({ event })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const event = await prisma.event.findFirst({ where: { id, adminId: auth.id } })
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  try {
    const { name, description, date, slideshowInterval, isActive } = await req.json()

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(slideshowInterval && { slideshowInterval }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ event: updated })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const event = await prisma.event.findFirst({ where: { id, adminId: auth.id } })
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  await prisma.event.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
