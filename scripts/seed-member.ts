// scripts/seed-member.ts
import { PrismaClient, MembershipStatus, HouseRole, OrganizationRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedMember() {
  console.log('🌱 Seeding test member...\n')

  // Configuration - Update these to match your existing data
  const config = {
    memberEmail: 'member@test.com',
    memberPassword: 'password123',
    memberName: 'Test Member',
    orgSlug: 'hq-kenya-house',
    houseSlug: 'main',
  }

  // 1. Find the organization and house
  const organization = await prisma.organization.findUnique({
    where: { slug: config.orgSlug }
  })

  if (!organization) {
    console.error(`❌ Organization with slug "${config.orgSlug}" not found`)
    console.log('\n📋 Available organizations:')
    const orgs = await prisma.organization.findMany({ select: { name: true, slug: true } })
    orgs.forEach(org => console.log(`   - ${org.name} (${org.slug})`))
    return
  }

  console.log(`✅ Found organization: ${organization.name}`)

  const house = await prisma.house.findFirst({
    where: {
      slug: config.houseSlug,
      organizationId: organization.id
    }
  })

  if (!house) {
    console.error(`❌ House with slug "${config.houseSlug}" not found in ${organization.name}`)
    console.log('\n📋 Available houses in this organization:')
    const houses = await prisma.house.findMany({ 
      where: { organizationId: organization.id },
      select: { name: true, slug: true }
    })
    houses.forEach(h => console.log(`   - ${h.name} (${h.slug})`))
    return
  }

  console.log(`✅ Found house: ${house.name}`)

  // 2. Create or find the member user
  let memberUser = await prisma.user.findUnique({
    where: { email: config.memberEmail }
  })

  if (!memberUser) {
    const hashedPassword = await bcrypt.hash(config.memberPassword, 12)
    
    memberUser = await prisma.user.create({
      data: {
        email: config.memberEmail,
        name: config.memberName,
        passwordHash: hashedPassword,
        emailVerified: new Date(),
        platformRole: 'USER',
      }
    })
    console.log(`✅ Created new user: ${memberUser.email}`)
  } else {
    console.log(`✅ User already exists: ${memberUser.email}`)
  }

  // 3. Create or find organization membership
  let membership = await prisma.membership.findFirst({
    where: {
      userId: memberUser.id,
      organizationId: organization.id
    }
  })

  if (!membership) {
    membership = await prisma.membership.create({
      data: {
        userId: memberUser.id,
        organizationId: organization.id,
        role: OrganizationRole.MEMBER,
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date(),
      }
    })
    console.log(`✅ Created organization membership`)
  } else {
    console.log(`✅ Organization membership already exists`)
  }

  // 4. Check if house membership already exists
  let houseMembership = await prisma.houseMembership.findFirst({
    where: {
      houseId: house.id,
      membershipId: membership.id
    }
  })

  if (houseMembership) {
    console.log(`✅ House membership already exists`)
    
    // Update to active if needed
    if (houseMembership.status !== 'ACTIVE') {
      await prisma.houseMembership.update({
        where: { id: houseMembership.id },
        data: { status: MembershipStatus.ACTIVE }
      })
      console.log(`✅ Activated existing house membership`)
    }
  } else {
    // Create new house membership - use raw MongoDB query to avoid unique constraint
    const result = await prisma.$runCommandRaw({
      insert: "HouseMembership",
      documents: [{
        houseId: { $oid: house.id },
        membershipId: { $oid: membership.id },
        role: HouseRole.HOUSE_MEMBER,
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date(),
        membershipNumber: `M${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        portalActivatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [],
      }]
    })
    
    console.log(`✅ Created house membership via raw command`)
    
    // Fetch the created membership
    houseMembership = await prisma.houseMembership.findFirst({
      where: {
        houseId: house.id,
        membershipId: membership.id
      }
    })
  }

  if (!houseMembership) {
    console.error('❌ Failed to create or find house membership')
    return
  }

  // 5. Create or find member profile
  await prisma.memberProfile.upsert({
    where: { houseMembershipId: houseMembership.id },
    update: {},
    create: {
      houseMembershipId: houseMembership.id,
      userId: memberUser.id,
      houseId: house.id,
      bio: 'This is a test member account for portal testing.',
      jobTitle: 'Software Engineer',
      company: 'Test Company',
      industry: 'Technology',
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      interests: ['Web Development', 'AI', 'Open Source'],
      phone: '+1234567890',
      notificationPreferences: {
        email: true,
        push: true,
        sms: false
      },
      privacySettings: {
        showEmail: true,
        showPhone: false,
        showCompany: true
      }
    }
  })
  console.log(`✅ Created/updated member profile`)

  // 6. Create member dashboard
  const memberDashboard = await prisma.memberDashboard.upsert({
    where: { houseMembershipId: houseMembership.id },
    update: {},
    create: {
      houseMembershipId: houseMembership.id,
      userId: memberUser.id,
      houseId: house.id,
      widgetLayout: {
        welcome: { enabled: true, order: 1 },
        events: { enabled: true, order: 2 },
        announcements: { enabled: true, order: 3 },
        quickActions: { enabled: true, order: 4 }
      },
      defaultView: 'grid',
      emailDigest: true,
      digestFrequency: 'weekly',
      portalLoginCount: 0,
    }
  })
  console.log(`✅ Created member dashboard`)

  // 7. Create some test activity
  await prisma.memberActivity.create({
    data: {
      houseMembershipId: houseMembership.id,
      dashboardId: memberDashboard.id,
      userId: memberUser.id,
      activityType: 'PROFILE_UPDATE',
      entityId: houseMembership.id,
      entityType: 'HOUSE_MEMBERSHIP',
      performedAt: new Date(),
      metadata: { action: 'completed_profile' }
    }
  })
  console.log(`✅ Created sample activity`)

  // Summary
  console.log('\n🎉 Seed complete!')
  console.log('\n📋 Test Member Login Details:')
  console.log('═══════════════════════════════════')
  console.log(`   Email:    ${config.memberEmail}`)
  console.log(`   Password: ${config.memberPassword}`)
  console.log(`   Portal:   http://localhost:3000/portal/${house.slug}`)
  console.log('═══════════════════════════════════')
  console.log('\n🚀 You can now log in and test the member portal!')
}

seedMember()
  .catch((error) => {
    console.error('❌ Seed failed:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })