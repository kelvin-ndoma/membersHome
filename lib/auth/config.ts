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