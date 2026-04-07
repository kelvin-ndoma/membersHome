// scripts/check-current-state.ts
import { prisma } from "../lib/db"

async function checkCurrentState() {
  console.log("=== Current Database State ===\n")

  // Check users
  const users = await prisma.user.findMany()
  console.log(`Users: ${users.length}`)
  users.forEach(u => console.log(`  - ${u.id}: ${u.email}`))

  // Check memberships
  const memberships = await prisma.membership.findMany({
    include: {
      user: true,
    },
  })
  console.log(`\nMemberships: ${memberships.length}`)
  memberships.forEach(m => {
    console.log(`  - ${m.id}: user=${m.user?.email || 'NO USER'} (org=${m.organizationId})`)
  })

  // Check house memberships
  const houseMemberships = await prisma.houseMembership.findMany({
    include: {
      membership: {
        include: {
          user: true,
        },
      },
      house: true,
    },
  })
  console.log(`\nHouse Memberships: ${houseMemberships.length}`)
  houseMemberships.forEach(hm => {
    console.log(`  - ${hm.id}: house=${hm.house?.name}, user=${hm.membership?.user?.email || 'NO USER'}`)
  })

  // Check membership items
  const items = await prisma.membershipItem.findMany({
    include: {
      user: true,
      membershipPlan: true,
    },
  })
  console.log(`\nMembership Items: ${items.length}`)
  items.forEach(item => {
    console.log(`  - ${item.id}: user=${item.user?.email || 'NO USER'}, plan=${item.membershipPlan?.name || 'NO PLAN'}`)
  })
}

checkCurrentState()
  .catch(console.error)
  .finally(() => process.exit())