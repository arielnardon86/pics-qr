import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthAdmin } from '@/lib/auth'
import { generateEventCode } from '@/lib/utils'

export async function GET() {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const events = await prisma.event.findMany({
    where: { adminId: auth.id },
    include: { _count: { select: { photos: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const { name, description, date, slideshowInterval } = await req.json()

    if (!name || !date) {
      return NextResponse.json({ error: 'Nombre y fecha requeridos' }, { status: 400 })
    }

    // Generate unique code
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
        adminId: auth.id,
        slideshowInterval: slideshowInterval || 5,
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al crear evento' }, { status: 500 })
  }
}
