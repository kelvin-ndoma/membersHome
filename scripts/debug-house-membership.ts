// scripts/debug-house-membership.ts
import { prisma } from '../lib/prisma'

async function debugHouseMembership() {
  const userId = '69daa14cfe9420af50a30681'
  const houseSlug = 'main'
  
  console.log('🔍 Debugging house membership')
  console.log('User ID:', userId)
  console.log('House slug:', houseSlug)
  console.log('')
  
  // Find all houses with this slug
  const allHouses = await prisma.house.findMany({
    where: { slug: houseSlug },
    include: { organization: true }
  })
  
  console.log(`📦 Found ${allHouses.length} house(s) with slug "${houseSlug}":`)
  allHouses.forEach((house, i) => {
    console.log(`  ${i + 1}. ID: ${house.id}`)
    console.log(`     Name: ${house.name}`)
    console.log(`     Organization: ${house.organization.name} (${house.organization.slug})`)
    console.log(`     Org ID: ${house.organizationId}`)
    console.log('')
  })
  
  // Check user's house memberships
  const userHouseMemberships = await prisma.houseMembership.findMany({
    where: {
      membership: {
        userId: userId,
        status: 'ACTIVE'
      },
      status: 'ACTIVE'
    },
    include: {
      house: {
        include: { organization: true }
      },
      membership: true
    }
  })
  
  console.log(`👤 User has ${userHouseMemberships.length} active house membership(s):`)
  userHouseMemberships.forEach((hm, i) => {
    console.log(`  ${i + 1}. House: ${hm.house.name} (${hm.house.slug})`)
    console.log(`     House ID: ${hm.house.id}`)
    console.log(`     Organization: ${hm.house.organization.name} (${hm.house.organization.slug})`)
    console.log(`     Role: ${hm.role}`)
    console.log(`     Membership ID: ${hm.id}`)
    console.log('')
  })
  
  // Now check if any of the user's house memberships match any house with slug "main"
  const matchingHouseIds = allHouses.map(h => h.id)
  const matchingMembership = userHouseMemberships.find(hm => 
    matchingHouseIds.includes(hm.house.id)
  )
  
  if (matchingMembership) {
    console.log('✅ Found matching membership!')
    console.log('   House ID:', matchingMembership.house.id)
    console.log('   Organization:', matchingMembership.house.organization.slug)
  } else {
    console.log('❌ No matching membership found!')
    console.log('   This means the user is a member of a DIFFERENT house with slug "main"')
    console.log('   or the membership query in the portal layout is failing.')
  }
}

debugHouseMembership()
  .catch(console.error)
  .finally(() => prisma.$disconnect())