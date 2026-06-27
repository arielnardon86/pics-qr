import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthAdmin } from '@/lib/auth'

// One-time endpoint to promote the logged-in admin to super admin.
// Requires SETUP_KEY env var for security.
export async function POST(req: NextRequest) {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { setupKey } = await req.json()
  if (!setupKey || setupKey !== process.env.SETUP_KEY) {
    return NextResponse.json({ error: 'Clave inválida' }, { status: 403 })
  }

  await prisma.admin.update({
    where: { id: auth.id },
    data: { isSuperAdmin: true },
  })

  return NextResponse.json({ success: true, message: `${auth.email} es ahora super admin` })
}
