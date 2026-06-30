import { NextRequest, NextResponse } from 'next/server'
import { getAuthAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('logo') as File | null
  if (!file || !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'El archivo no puede superar 5MB' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Resize to max 300x300, convert to PNG with transparency preserved
  const optimized = await sharp(buffer)
    .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer()

  const base64 = `data:image/png;base64,${optimized.toString('base64')}`

  await prisma.admin.update({
    where: { id: auth.id },
    data: { logoUrl: base64 },
  })

  return NextResponse.json({ logoUrl: base64 })
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuthAdmin()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await prisma.admin.update({
    where: { id: auth.id },
    data: { logoUrl: null },
  })

  return NextResponse.json({ success: true })
}
