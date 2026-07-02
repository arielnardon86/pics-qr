import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mpClient } from '@/lib/mercadopago'
import { Payment } from 'mercadopago'
import { generateEventCode } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const status = params.get('status') ?? params.get('collection_status')
  const paymentId = params.get('payment_id') ?? params.get('collection_id')
  const externalRef = params.get('external_reference')

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const dashboard = `${baseUrl}/admin/dashboard`

  if (!externalRef) {
    return NextResponse.redirect(`${dashboard}?payment=failed`)
  }

  // Handle non-approved statuses without hitting the API
  if (status && status !== 'approved') {
    return NextResponse.redirect(`${dashboard}?payment=${status === 'pending' ? 'pending' : 'failed'}`)
  }

  try {
    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id: externalRef },
    })

    if (!paymentRequest) {
      return NextResponse.redirect(`${dashboard}?payment=failed`)
    }

    // Already processed (idempotent)
    if (paymentRequest.status === 'approved') {
      return NextResponse.redirect(`${dashboard}?payment=success`)
    }

    // Verify with MP API when possible
    if (paymentId) {
      try {
        const payment = new Payment(mpClient)
        const paymentData = await payment.get({ id: paymentId })
        if (paymentData.status !== 'approved') {
          return NextResponse.redirect(`${dashboard}?payment=${paymentData.status === 'pending' ? 'pending' : 'failed'}`)
        }
      } catch {
        // If verification fails, rely on status param + webhook will correct later
        if (status !== 'approved') {
          return NextResponse.redirect(`${dashboard}?payment=failed`)
        }
      }
    }

    const event = await createEventForRequest(paymentRequest.id, paymentRequest.adminId, paymentRequest.eventName, paymentRequest.eventDate, paymentId ?? null)
    if (!event) return NextResponse.redirect(`${dashboard}?payment=error`)

    return NextResponse.redirect(`${dashboard}?payment=success`)
  } catch (error) {
    console.error('[mp] callback error:', error)
    return NextResponse.redirect(`${dashboard}?payment=error`)
  }
}

export async function createEventForRequest(
  paymentRequestId: string,
  adminId: string,
  eventName: string,
  eventDate: Date,
  mpPaymentId: string | null,
) {
  const superAdmin = await prisma.admin.findFirst({ where: { isSuperAdmin: true } })
  if (!superAdmin) return null

  let code = generateEventCode()
  let attempts = 0
  while (attempts < 10) {
    const existing = await prisma.event.findUnique({ where: { code } })
    if (!existing) break
    code = generateEventCode()
    attempts++
  }

  const event = await prisma.event.create({
    data: {
      name: eventName,
      date: eventDate,
      code,
      adminId: superAdmin.id,
      clientId: adminId,
      slideshowInterval: 5,
      isActive: true,
    },
  })

  await prisma.paymentRequest.update({
    where: { id: paymentRequestId },
    data: {
      status: 'approved',
      mpPaymentId: mpPaymentId ?? undefined,
      eventId: event.id,
    },
  })

  return event
}
