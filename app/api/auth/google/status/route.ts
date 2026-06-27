import { NextRequest, NextResponse } from 'next/server'
import { getAuthAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'
import { getOAuthClient } from '@/lib/google-drive'

export async function GET(req: NextRequest) {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const eventId = new URL(req.url).searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ connected: false })

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { googleAccessToken: true, googleRefreshToken: true, googleTokenExpiry: true },
  })

  if (!event?.googleAccessToken) {
    return NextResponse.json({ connected: false })
  }

  try {
    const client = getOAuthClient()
    client.setCredentials({
      access_token: event.googleAccessToken,
      refresh_token: event.googleRefreshToken,
      expiry_date: event.googleTokenExpiry?.getTime(),
    })
    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const userInfo = await oauth2.userinfo.get()
    return NextResponse.json({ connected: true, email: userInfo.data.email })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
