import { getServerSession } from "next-auth"
import { authOptions } from "./config"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"

export async function getSession() {
  return getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()

  if (!session?.user?.id) return null

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      phone: true,
      platformRole: true,
      mfaEnabled: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function requirePageAuth() {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  return session
}

export async function requireApiAuth() {
  const session = await getSession()

  if (!session?.user?.id) {
    const error = new Error("Unauthorized")
    ;(error as any).status = 401
    throw error
  }

  return session
}

export async function requirePlatformAdmin() {
  const session = await requireApiAuth()

  if (session.user.platformRole !== "PLATFORM_ADMIN") {
    const error = new Error("Forbidden")
    ;(error as any).status = 403
    throw error
  }

  return session
}

export async function requireOrgAccess(orgSlug: string) {
  const session = await requireApiAuth()

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
      status: "ACTIVE",
    },
    include: {
      organization: true,
    },
  })

  if (!membership) {
    const error = new Error("Forbidden")
    ;(error as any).status = 403
    throw error
  }

  return { session, membership }
}

export async function requireHouseAccess(orgSlug: string, houseSlug: string) {
  const { session, membership } = await requireOrgAccess(orgSlug)

  const houseMembership = await prisma.houseMembership.findFirst({
    where: {
      membershipId: membership.id,
      house: { slug: houseSlug },
      status: "ACTIVE",
    },
    include: {
      house: true,
    },
  })

  if (!houseMembership) {
    const error = new Error("Forbidden")
    ;(error as any).status = 403
    throw error
  }

  return { session, membership, houseMembership }
}

export async function hasOrgRole(orgSlug: string, roles: string[]) {
  const session = await getSession()
  if (!session?.user?.id) return false

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
      organizationRole: { in: roles as any },
      status: "ACTIVE",
    },
  })

  return !!membership
}

export async function hasHouseRole(orgSlug: string, houseSlug: string, roles: string[]) {
  const session = await getSession()
  if (!session?.user?.id) return false

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
      status: "ACTIVE",
    },
  })

  if (!membership) return false

  const houseMembership = await prisma.houseMembership.findFirst({
    where: {
      membershipId: membership.id,
      house: { slug: houseSlug },
      role: { in: roles as any },
      status: "ACTIVE",
    },
  })

  return !!houseMembership
}