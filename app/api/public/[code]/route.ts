import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSettings } from '@/lib/settings'

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
      nsfwFilter: true,
      uploadsPaused: true,
    },
  })

  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  const s = await getSettings(['upload_hours_before', 'upload_hours_after'])
  return NextResponse.json({
    event: {
      ...event,
      uploadHoursBefore: Number(s.upload_hours_before),
      uploadHoursAfter:  Number(s.upload_hours_after),
    },
  })
}
