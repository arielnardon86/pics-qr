import { NextResponse } from 'next/server'
import { getAuthAdmin } from '@/lib/auth'
import { getAuthUrl } from '@/lib/google-drive'

export async function GET() {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Google OAuth no configurado. Agregá GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET al archivo .env' },
      { status: 503 }
    )
  }

  const url = getAuthUrl()
  return NextResponse.redirect(url)
}

export async function DELETE() {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { prisma } = await import('@/lib/prisma')
  await prisma.admin.update({
    where: { id: auth.id },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
    },
  })

  return NextResponse.json({ success: true })
}
