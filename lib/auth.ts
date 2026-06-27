import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'pics-qr-secret'

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: { id: string; email: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { id: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string }
  } catch {
    return null
  }
}

export async function getAuthAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getAuthAdminFull() {
  const auth = await getAuthAdmin()
  if (!auth) return null
  return prisma.admin.findUnique({
    where: { id: auth.id },
    select: { id: true, email: true, name: true, isSuperAdmin: true },
  })
}
