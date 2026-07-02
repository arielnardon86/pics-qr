import { MercadoPagoConfig } from 'mercadopago'

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export const MP_EVENT_PRICE = Number(process.env.MP_EVENT_PRICE ?? 1)
