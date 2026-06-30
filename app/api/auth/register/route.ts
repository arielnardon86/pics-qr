import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, setupKey } = await req.json()

    const existing = await prisma.admin.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
    }

    // First admin becomes super admin; only that first registration needs a setupKey
    const adminCount = await prisma.admin.count()
    const isSuperAdmin = adminCount === 0

    if (isSuperAdmin && process.env.SETUP_KEY && setupKey !== process.env.SETUP_KEY) {
      return NextResponse.json({ error: 'Clave de configuración inválida' }, { status: 403 })
    }

    const hashedPassword = await hashPassword(password)
    const admin = await prisma.admin.create({
      data: { email, password: hashedPassword, name, isSuperAdmin },
    })

    const token = signToken({ id: admin.id, email: admin.email })

    const response = NextResponse.json({
      success: true,
      admin: { id: admin.id, email: admin.email, name: admin.name, isSuperAdmin: admin.isSuperAdmin },
    })
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
