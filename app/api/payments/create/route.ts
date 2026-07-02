import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthAdminFull } from '@/lib/auth'
import { mpClient, MP_EVENT_PRICE } from '@/lib/mercadopago'
import { Preference } from 'mercadopago'

export async function POST(req: NextRequest) {
  const admin = await getAuthAdminFull()
  if (!admin) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (admin.isSuperAdmin) return NextResponse.json({ error: 'El super admin crea eventos directamente' }, { status: 403 })

  if (!process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'Pagos no configurados' }, { status: 503 })
  }

  const { eventName, eventDate } = await req.json()
  if (!eventName?.trim() || !eventDate) {
    return NextResponse.json({ error: 'Nombre y fecha requeridos' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  try {
    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        adminId: admin.id,
        eventName: eventName.trim(),
        eventDate: new Date(eventDate + 'T12:00:00Z'),
        status: 'pending',
      },
    })

    const preference = new Preference(mpClient)
    const result = await preference.create({
      body: {
        items: [{
          id: 'event-creation',
          title: `Total Pics — ${eventName.trim()}`,
          quantity: 1,
          unit_price: MP_EVENT_PRICE,
          currency_id: 'ARS',
        }],
        payer: { email: admin.email },
        back_urls: {
          success: `${baseUrl}/api/payments/callback`,
          failure: `${baseUrl}/api/payments/callback`,
          pending: `${baseUrl}/api/payments/callback`,
        },
        auto_return: 'approved',
        external_reference: paymentRequest.id,
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      },
    })

    await prisma.paymentRequest.update({
      where: { id: paymentRequest.id },
      data: { mpPreferenceId: result.id ?? null },
    })

    return NextResponse.json({ checkoutUrl: result.init_point })
  } catch (error) {
    console.error('[mp] create preference error:', error)
    return NextResponse.json({ error: 'Error al crear el pago' }, { status: 500 })
  }
}
