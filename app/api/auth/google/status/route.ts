import { NextResponse } from 'next/server'
import { getAuthAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'
import { getOAuthClient } from '@/lib/google-drive'

export async function GET() {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = await prisma.admin.findUnique({
    where: { id: auth.id },
    select: { googleAccessToken: true, googleRefreshToken: true, googleTokenExpiry: true },
  })

  if (!admin?.googleAccessToken) {
    return NextResponse.json({ connected: false })
  }

  // Get the connected Google account email
  try {
    const client = getOAuthClient()
    client.setCredentials({
      access_token: admin.googleAccessToken,
      refresh_token: admin.googleRefreshToken,
      expiry_date: admin.googleTokenExpiry?.getTime(),
    })
    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const userInfo = await oauth2.userinfo.get()
    return NextResponse.json({ connected: true, email: userInfo.data.email })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
