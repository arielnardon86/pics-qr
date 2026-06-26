import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('admin123', 10)

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@picsqr.com' },
    update: {},
    create: {
      email: 'admin@picsqr.com',
      password,
      name: 'Administrador',
    },
  })

  console.log('Admin creado:', admin.email)
  console.log('Contraseña: admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
