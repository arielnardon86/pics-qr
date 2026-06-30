import { NextResponse } from 'next/server'
import { getAuthAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = await prisma.admin.findUnique({
    where: { id: auth.id },
    select: { id: true, email: true, name: true, isSuperAdmin: true, logoUrl: true },
  })

  if (!admin) return NextResponse.json({ error: 'Admin no encontrado' }, { status: 404 })
  return NextResponse.json({ admin })
}
