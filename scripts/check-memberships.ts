import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMemberships() {
  const user = await prisma.user.findUnique({
    where: { email: 'kelvinmutuandoma@gmail.com' },
    include: {
      memberships: {
        include: {
          organization: {
            select: { id: true, name: true, slug: true, status: true }
          },
          houseMemberships: {
            include: { 
              house: {
                select: { id: true, name: true, slug: true }
              } 
            }
          }
        }
      }
    }
  })
  
  console.log('User:', user?.email, 'ID:', user?.id)
  console.log('Total memberships:', user?.memberships.length)
  console.log('')
  
  user?.memberships.forEach((m, i) => {
    console.log(`Membership ${i + 1}:`)
    console.log('  - Org ID:', m.organizationId)
    console.log('  - Organization:', m.organization?.name || 'NULL (deleted?)')
    console.log('  - Role:', m.role)
    console.log('  - Status:', m.status)
    console.log('  - House memberships:', m.houseMemberships.length)
    m.houseMemberships.forEach((hm, j) => {
      console.log(`      ${j + 1}. House:`, hm.house?.name || 'NULL', 'Role:', hm.role, 'Status:', hm.status)
    })
    console.log('')
  })
  
  // Also check if there are any memberships with null organization
  const orphanedMemberships = user?.memberships.filter(m => !m.organization)
  if (orphanedMemberships && orphanedMemberships.length > 0) {
    console.log('⚠️ Found', orphanedMemberships.length, 'orphaned membership(s) - organizations were deleted')
  }
}

checkMemberships()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
