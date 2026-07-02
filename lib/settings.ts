import { prisma } from './prisma'

const DEFAULTS: Record<string, string> = {
  event_price: process.env.MP_EVENT_PRICE ?? '5000',
  upload_hours_before: '24',
  upload_hours_after: '48',
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } })
  const result: Record<string, string> = {}
  for (const key of keys) {
    result[key] = rows.find(r => r.key === key)?.value ?? DEFAULTS[key] ?? ''
  }
  return result
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}
