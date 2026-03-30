import { getServerSession } from "next-auth"
import { authOptions } from "./config"
import { prisma } from "@/lib/db"
import { cookies } from "next/headers"

export async function getServerSessionWithCookies() {
  return await getServerSession(authOptions)
}

export async function getCurrentUserWithMemberships() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        include: {
          organization: true,
          houseMemberships: {
            include: {
              house: true,
            }
          }
        }
      }
    }
  })

  return user
}

export async function getUserOrganizations() {
  const user = await getCurrentUserWithMemberships()
  
  if (!user) {
    return []
  }

  return user.memberships.map(m => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    logoUrl: m.organization.logoUrl,
    role: m.organizationRole,
    houses: m.houseMemberships.map(h => ({
      id: h.house.id,
      name: h.house.name,
      slug: h.house.slug,
      role: h.role,
    }))
  }))
}

export async function getActiveMembership(orgSlug: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
      status: "ACTIVE",
    },
    include: {
      organization: true,
    }
  })

  return membership
}

export async function getActiveHouseMembership(orgSlug: string, houseSlug: string) {
  const membership = await getActiveMembership(orgSlug)
  
  if (!membership) {
    return null
  }

  const houseMembership = await prisma.houseMembership.findFirst({
    where: {
      membershipId: membership.id,
      house: { slug: houseSlug },
      status: "ACTIVE",
    },
    include: {
      house: true,
    }
  })

  return houseMembership
}

export async function getCurrentSession() {
  return await getServerSession(authOptions)
}

export function getSessionToken() {
  const cookieStore = cookies()
  return cookieStore.get("next-auth.session-token")?.value
}