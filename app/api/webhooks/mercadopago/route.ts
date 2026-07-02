import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mpClient } from '@/lib/mercadopago'
import { Payment } from 'mercadopago'
import { createEventForRequest } from '@/app/api/payments/callback/route'
import { createHmac } from 'crypto'

function verifySignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return true // skip validation if secret not configured yet

  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id')
  if (!xSignature) return false

  // Parse ts and v1 from "ts=...,v1=..."
  const parts = Object.fromEntries(
    xSignature.split(',').map(p => p.split('=') as [string, string])
  )
  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  // Extract data.id from body
  let dataId: string | undefined
  try {
    dataId = JSON.parse(rawBody)?.data?.id
  } catch {
    return false
  }

  const manifest = [
    dataId ? `id:${dataId}` : null,
    xRequestId ? `request-id:${xRequestId}` : null,
    `ts:${ts}`,
  ].filter(Boolean).join(';') + ';'

  const expected = createHmac('sha256', secret).update(manifest).digest('hex')
  return expected === v1
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    if (!verifySignature(req, rawBody)) {
      console.warn('[mp] webhook signature mismatch')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)

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
