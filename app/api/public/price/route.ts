import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/settings'

export async function GET() {
  const { event_price } = await getSettings(['event_price'])
  return NextResponse.json({ price: Number(event_price) })
}
