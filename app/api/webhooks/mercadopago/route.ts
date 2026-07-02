import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mpClient } from '@/lib/mercadopago'
import { Payment } from 'mercadopago'
import { createEventForRequest } from '@/app/api/payments/callback/route'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.type !== 'payment' || !body.data?.id) {
      return NextResponse.json({ received: true })
    }

    const paymentId = String(body.data.id)

    const payment = new Payment(mpClient)
    const paymentData = await payment.get({ id: paymentId })

    if (paymentData.status !== 'approved') {
      return NextResponse.json({ received: true })
    }

    const externalRef = paymentData.external_reference
    if (!externalRef) return NextResponse.json({ received: true })

    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id: externalRef },
    })

    if (!paymentRequest || paymentRequest.status === 'approved') {
      return NextResponse.json({ received: true })
    }

    await createEventForRequest(
      paymentRequest.id,
      paymentRequest.adminId,
      paymentRequest.eventName,
      paymentRequest.eventDate,
      paymentId,
    )

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[mp] webhook error:', error)
    return NextResponse.json({ error: 'webhook error' }, { status: 500 })
  }
}
