import { DefaultSession } from "next-auth"
import { PlatformRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      platformRole: PlatformRole
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    platformRole: PlatformRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    platformRole: PlatformRole
  }
}