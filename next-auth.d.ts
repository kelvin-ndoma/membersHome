import { DefaultSession, DefaultUser } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

interface HouseMembershipInfo {
  houseId: string
  role: string
  house: {
    id: string
    name: string
    slug: string
  }
}

interface MembershipInfo {
  id: string
  organizationId: string
  organizationRole: string
  organization: {
    id: string
    name: string
    slug: string
  }
  houseMemberships: HouseMembershipInfo[]
}

declare module "next-auth" {
  interface User extends DefaultUser {
    platformRole: string
    memberships: MembershipInfo[]
  }

  interface Session {
    user: {
      id: string
      platformRole: string
      memberships: MembershipInfo[]
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    platformRole: string
    memberships: MembershipInfo[]
  }
}