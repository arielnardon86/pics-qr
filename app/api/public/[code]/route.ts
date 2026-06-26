import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  const event = await prisma.event.findUnique({
    where: { code: code.toUpperCase() },
    select: {
      id: true,
      name: true,
      description: true,
      date: true,
      code: true,
      isActive: true,
      slideshowInterval: true,
    },
  })

  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  return NextResponse.json({ event })
}
