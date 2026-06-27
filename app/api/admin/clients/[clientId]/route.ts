import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthAdminFull } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const admin = await getAuthAdminFull()
  if (!admin) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!admin.isSuperAdmin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { clientId } = await params

  const client = await prisma.admin.findUnique({
    where: { id: clientId },
    select: { isSuperAdmin: true },
  })

  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  if (client.isSuperAdmin) return NextResponse.json({ error: 'No podés eliminar un super admin' }, { status: 400 })

  // Unassign events from this client before deleting
  await prisma.event.updateMany({
    where: { clientId },
    data: { clientId: null },
  })

  await prisma.admin.delete({ where: { id: clientId } })
  return NextResponse.json({ success: true })
}
