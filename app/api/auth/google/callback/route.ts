import { NextRequest, NextResponse } from 'next/server'
import { getAuthAdmin } from '@/lib/auth'
import { getOAuthClient } from '@/lib/google-drive'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.redirect(new URL('/admin/login', req.url))

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    const reason = error === 'access_denied' ? 'Acceso denegado por el usuario' : 'Error en la autenticación'
    return NextResponse.redirect(
      new URL(`/admin/dashboard?google_error=${encodeURIComponent(reason)}`, req.url)
    )
  }

  try {
    const client = getOAuthClient()
    const { tokens } = await client.getToken(code)

    await prisma.admin.update({
      where: { id: auth.id },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token ?? undefined,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    })

    return NextResponse.redirect(
      new URL('/admin/dashboard?google_ok=1', req.url)
    )
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/admin/dashboard?google_error=Error+al+obtener+tokens', req.url)
    )
  }
}
