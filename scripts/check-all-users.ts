import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAllUsers() {
  console.log('=== ALL USERS ===\n')
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      invitationToken: true,
      invitationSentAt: true,
      platformRole: true,
    }
  })
  
  users.forEach(user => {
    console.log(`📧 ${user.email} (${user.platformRole})`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Token: ${user.invitationToken ? user.invitationToken.substring(0, 30) + '...' : 'NULL'}`)
    console.log(`   Sent: ${user.invitationSentAt?.toISOString() || 'NULL'}`)
    console.log('')
  })
  
  console.log('\n=== ORGANIZATIONS ===\n')
  
  const orgs = await prisma.organization.findMany({
    include: {
      memberships: {
        where: { role: 'ORG_OWNER' },
        include: { user: true }
      }
    }
  })
  
  orgs.forEach(org => {
    console.log(`🏢 ${org.name} (${org.slug})`)
    console.log(`   ID: ${org.id}`)
    console.log(`   Owners:`)
    org.memberships.forEach(m => {
      console.log(`     - ${m.user.email} (User ID: ${m.user.id})`)
    })
    console.log('')
  })
}

checkAllUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
