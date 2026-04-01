// lib/utils/membership.ts
import { prisma } from "@/lib/db"

export async function getMemberHouses(userId: string, orgSlug: string) {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      organization: { slug: orgSlug },
      status: "ACTIVE",
    },
    include: {
      houseMemberships: {
        where: { status: "ACTIVE" },
        include: { house: true },
      },
    },
  })

  if (!membership) return null

  return {
    membership,
    houses: membership.houseMemberships.map(hm => hm.house),
    houseMemberships: membership.houseMemberships,
  }
}

export async function getCurrentHouse(userId: string, orgSlug: string, houseSlug?: string) {
  const { membership, houses, houseMemberships } = await getMemberHouses(userId, orgSlug) || {}
  
  if (!membership) return null
  
  // If specific house slug is provided
  if (houseSlug) {
    const houseMembership = houseMemberships?.find(hm => hm.house.slug === houseSlug)
    if (houseMembership) {
      return {
        house: houseMembership.house,
        houseMembership,
        membership,
      }
    }
    return null
  }
  
  // Return first house if member has any
  if (houses && houses.length > 0) {
    return {
      house: houses[0],
      houseMembership: houseMemberships?.[0],
      membership,
    }
  }
  
  return { membership, house: null, houseMembership: null }
}