import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Clever Cloud DEV plan allows only 5 Postgres connections. Prisma's default pool
// (2 × CPUs + 1) can exceed that, and during a Render deploy the old and new
// instances overlap, so keep each instance at 2 and leave room for migrations/Studio.
// Values already present in DATABASE_URL take precedence.
function databaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL
  if (!url?.startsWith('postgres')) return url
  const u = new URL(url)
  if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', '2')
  if (!u.searchParams.has('pool_timeout')) u.searchParams.set('pool_timeout', '20')
  return u.toString()
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: databaseUrl() })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
