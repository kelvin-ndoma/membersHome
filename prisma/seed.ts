import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create platform admin user if not exists
  const adminEmail = 'kelvinndomamutua@gmail.com'
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('ChangeMe123!', 10)
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Platform Admin',
        passwordHash: hashedPassword,
        platformRole: 'PLATFORM_ADMIN',
        emailVerified: new Date(),
      }
    })
    
    console.log(`✅ Platform admin created: ${admin.email}`)
  } else {
    console.log('ℹ️ Platform admin already exists')
  }

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })