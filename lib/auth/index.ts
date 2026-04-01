// lib/auth/index.ts
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { PlatformRole } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials")
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isValid) {
          throw new Error("Invalid credentials")
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          platformRole: user.platformRole,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.platformRole = user.platformRole as PlatformRole
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.platformRole = token.platformRole as PlatformRole
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Import getServerSession from next-auth
import { getServerSession } from "next-auth"

// Export getSession as the main function to get the session
export async function getSession() {
  return getServerSession(authOptions)
}

// Get the full current user with all details
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

// Require authentication for pages (redirects if not authenticated)
export async function requirePageAuth() {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  return session
}

// Require authentication for API routes (throws error if not authenticated)
export async function requireApiAuth() {
  const session = await getSession()

  if (!session?.user?.id) {
    const error = new Error("Unauthorized")
    ;(error as any).status = 401
    throw error
  }

  return session
}

// Require platform admin role
export async function requirePlatformAdmin() {
  const session = await requireApiAuth()

  if (session.user.platformRole !== "PLATFORM_ADMIN") {
    const error = new Error("Forbidden")
    ;(error as any).status = 403
    throw error
  }

  return session
}

// Require organization access
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

// Require house access
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

// Check if user has specific organization role
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

// Check if user has specific house role
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

// Import redirect for page auth
import { redirect } from "next/navigation"