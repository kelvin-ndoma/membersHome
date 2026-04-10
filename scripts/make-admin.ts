// scripts/clean-database.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanDatabase() {
  console.log('🧹 Starting database cleanup...\n')

  // Find the platform admin
  const platformAdmin = await prisma.user.findFirst({
    where: { platformRole: 'PLATFORM_ADMIN' }
  })

  if (!platformAdmin) {
    console.error('❌ No platform admin found! Aborting.')
    return
  }

  console.log('✅ Keeping platform admin:', platformAdmin.email)
  console.log('   ID:', platformAdmin.id)
  console.log('')

  // Delete in order to respect foreign keys

  console.log('Deleting ticket validations...')
  await prisma.ticketValidation.deleteMany({})

  console.log('Deleting ticket purchases...')
  await prisma.ticketPurchase.deleteMany({})

  console.log('Deleting tickets...')
  await prisma.ticket.deleteMany({})

  console.log('Deleting RSVPs...')
  await prisma.rSVP.deleteMany({})

  console.log('Deleting events...')
  await prisma.event.deleteMany({})

  console.log('Deleting member messages...')
  await prisma.memberMessage.deleteMany({})

  console.log('Deleting member activities...')
  await prisma.memberActivity.deleteMany({})

  console.log('Deleting member dashboards...')
  await prisma.memberDashboard.deleteMany({})

  console.log('Deleting member profiles...')
  await prisma.memberProfile.deleteMany({})

  console.log('Deleting cancellation requests...')
  await prisma.cancellationRequest.deleteMany({})

  console.log('Deleting membership items...')
  await prisma.membershipItem.deleteMany({})

  console.log('Deleting form submissions...')
  await prisma.formSubmission.deleteMany({})

  console.log('Deleting custom forms...')
  await prisma.customForm.deleteMany({})

  console.log('Deleting communications...')
  await prisma.communication.deleteMany({})

  console.log('Deleting reports...')
  await prisma.report.deleteMany({})

  console.log('Deleting invoices...')
  await prisma.invoice.deleteMany({})

  console.log('Deleting payments...')
  await prisma.payment.deleteMany({})

  console.log('Deleting membership applications...')
  await prisma.membershipApplication.deleteMany({})

  console.log('Deleting plan prices...')
  await prisma.planPrice.deleteMany({})

  console.log('Deleting membership plans...')
  await prisma.membershipPlan.deleteMany({})

  console.log('Deleting member portals...')
  await prisma.memberPortal.deleteMany({})

  console.log('Deleting house memberships...')
  await prisma.houseMembership.deleteMany({})

  console.log('Deleting houses...')
  await prisma.house.deleteMany({})

  console.log('Deleting memberships...')
  await prisma.membership.deleteMany({})

  console.log('Deleting organizations...')
  await prisma.organization.deleteMany({})

  console.log('Deleting audit logs (except platform admin actions)...')
  await prisma.auditLog.deleteMany({
    where: {
      userId: { not: platformAdmin.id }
    }
  })

  console.log('Deleting all users except platform admin...')
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { not: platformAdmin.id }
    }
  })

  console.log(`\n✅ Deleted ${deletedUsers.count} users`)

  // Clear platform admin's invitation token
  console.log('\nClearing platform admin invitation token...')
  await prisma.user.update({
    where: { id: platformAdmin.id },
    data: {
      invitationToken: null,
      invitationSentAt: null,
      invitationAcceptedAt: null,
    }
  })

  // Clear platform admin's memberships
  await prisma.membership.deleteMany({
    where: { userId: platformAdmin.id }
  })

  console.log('\n🎉 Database cleaned successfully!')
  console.log('   Platform admin kept:', platformAdmin.email)
  console.log('\nYou can now create a fresh organization.')
}

cleanDatabase()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })