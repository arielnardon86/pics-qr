import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthAdminFull, hashPassword } from '@/lib/auth'

export async function GET() {
  const admin = await getAuthAdminFull()
  if (!admin) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!admin.isSuperAdmin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const clients = await prisma.admin.findMany({
    where: { isSuperAdmin: false },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      clientEvents: {
        select: { id: true, name: true, isActive: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ clients })
}

export async function POST(req: NextRequest) {
  const admin = await getAuthAdminFull()
  if (!admin) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!admin.isSuperAdmin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  try {
    const { email, password, name } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, contraseña y nombre requeridos' }, { status: 400 })
    }

    const existing = await prisma.admin.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    const client = await prisma.admin.create({
      data: { email, password: hashedPassword, name, isSuperAdmin: false },
    })

    return NextResponse.json({
      client: { id: client.id, email: client.email, name: client.name },
    }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
