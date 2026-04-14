// scripts/check-user-memberships.ts
import { prisma } from '../lib/prisma'

async function checkUserMemberships(userId: string) {
  console.log('🔍 Checking memberships for user:', userId)
  console.log('')
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          organization: true,
          houseMemberships: {
            include: {
              house: true
            }
          }
        }
      }
    }
  })
  
  if (!user) {
    console.log('❌ User not found')
    return
  }
  
  console.log('📧 User:', user.email, user.name)
  console.log('👑 Platform Role:', user.platformRole)
  console.log('')
  
  console.log('🏢 Organizations:')
  for (const membership of user.memberships) {
    console.log(`  - ${membership.organization.name} (${membership.organization.slug})`)
    console.log(`    Role: ${membership.role}`)
    console.log(`    Status: ${membership.status}`)
    
    if (membership.houseMemberships.length > 0) {
      console.log('    🏠 Houses:')
      for (const hm of membership.houseMemberships) {
        console.log(`      - ${hm.house.name} (${hm.house.slug})`)
        console.log(`        Role: ${hm.role}`)
        console.log(`        Status: ${hm.status}`)
      }
    } else {
      console.log('    🏠 Houses: None')
    }
    console.log('')
  }
}

const userId = process.argv[2] || '69daa14cfe9420af50a30681'
checkUserMemberships(userId)
  .catch(console.error)
  .finally(() => prisma.$disconnect())