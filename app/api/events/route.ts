import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthAdminFull } from '@/lib/auth'
import { generateEventCode } from '@/lib/utils'

export async function GET() {
  const admin = await getAuthAdminFull()
  if (!admin) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const events = await prisma.event.findMany({
    where: admin.isSuperAdmin
      ? {}
      : { clientId: admin.id },
    include: {
      _count: { select: { photos: true } },
      client: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  const admin = await getAuthAdminFull()
  if (!admin) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!admin.isSuperAdmin) return NextResponse.json({ error: 'Sin permisos para crear eventos' }, { status: 403 })

  try {
    const { name, description, date, slideshowInterval, clientId, nsfwFilter } = await req.json()

    if (!name || !date) {
      return NextResponse.json({ error: 'Nombre y fecha requeridos' }, { status: 400 })
    }

    let code = generateEventCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.event.findUnique({ where: { code } })
      if (!existing) break
      code = generateEventCode()
      attempts++
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        date: new Date(date),
        code,
        adminId: admin.id,
        slideshowInterval: slideshowInterval || 5,
        clientId: clientId || null,
        nsfwFilter: nsfwFilter !== false,
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al crear evento' }, { status: 500 })
  }
}
