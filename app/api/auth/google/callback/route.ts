import { NextRequest, NextResponse } from 'next/server'
import { getAuthAdmin } from '@/lib/auth'
import { getOAuthClient } from '@/lib/google-drive'
import { prisma } from '@/lib/prisma'

function baseUrl(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_BASE_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`
}

export async function GET(req: NextRequest) {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.redirect(new URL('/admin/login', baseUrl(req)))

  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state') // eventId
  const error = searchParams.get('error')

  if (error || !code || !state) {
    const reason = error === 'access_denied' ? 'Acceso denegado' : 'Error en la autenticación'
    return NextResponse.redirect(
      new URL(`/admin/dashboard?google_error=${encodeURIComponent(reason)}`, baseUrl(req))
    )
  }

  try {
    const client = getOAuthClient()
    const { tokens } = await client.getToken(code)

    await prisma.event.update({
      where: { id: state },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token ?? undefined,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    })

    return NextResponse.redirect(
      new URL(`/admin/events/${state}?google_ok=1`, baseUrl(req))
    )
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/admin/dashboard?google_error=Error+al+obtener+tokens', baseUrl(req))
    )
  }
}
