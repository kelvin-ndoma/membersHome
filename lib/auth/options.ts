import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/prisma/client"
import { sendVerificationEmail } from "@/lib/email"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            memberships: {
              include: {
                organization: true,
                houseMemberships: {
                  include: {
                    house: true
                  }
                }
              }
            }
          }
        })

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials")
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isValid) {
          throw new Error("Invalid credentials")
        }

        if (!user.emailVerified) {
          const verificationLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${user.id}`
          await sendVerificationEmail(user.email, verificationLink, user.name || undefined)
          throw new Error("Please verify your email address. A new verification link has been sent.")
        }

        // Transform memberships to include organization slug
        const transformedMemberships = user.memberships.map(membership => ({
          id: membership.id,
          organizationId: membership.organizationId,
          organizationRole: membership.organizationRole,
          status: membership.status,
          organization: {
            id: membership.organization.id,
            name: membership.organization.name,
            slug: membership.organization.slug
          },
          houseMemberships: membership.houseMemberships.map(hm => ({
            houseId: hm.houseId,
            role: hm.role,
            status: hm.status,
            house: {
              id: hm.house.id,
              name: hm.house.name,
              slug: hm.house.slug
            }
          }))
        }))

        console.log(`User ${user.email} logging in with role: ${user.platformRole}`)
        console.log("Memberships:", JSON.stringify(transformedMemberships, null, 2))

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          platformRole: user.platformRole,
          memberships: transformedMemberships
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.platformRole = user.platformRole
        token.memberships = user.memberships
        console.log(`JWT token set with role: ${user.platformRole}`)
        console.log("JWT memberships:", JSON.stringify(user.memberships, null, 2))
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.platformRole = token.platformRole as string
        session.user.memberships = token.memberships as any[]
        console.log(`Session set with role: ${token.platformRole}`)
        console.log("Session memberships:", JSON.stringify(session.user.memberships, null, 2))
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/verify-email",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
}