import "next-auth"

declare module "next-auth" {
  interface User {
    platformRole?: string
  }
  
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      platformRole?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    platformRole?: string
  }
}