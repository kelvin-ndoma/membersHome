import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default withAuth(
  function middleware(req: NextRequest) {
    const token = (req as any).nextauth?.token
    const path = req.nextUrl.pathname

    if (path.startsWith("/admin")) {
      if (token?.platformRole !== "PLATFORM_ADMIN") {
        return NextResponse.redirect(new URL("/", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    pages: {
      signIn: "/auth/login",
      error: "/auth/error",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        const publicPaths = [
          "/",
          "/auth/login",
          "/auth/register",
          "/auth/error",
          "/auth/verify-request",
          "/marketing",
          "/tickets",
          "/invite",
          "/house/invite",
        ]

        if (path.startsWith("/api/")) return true

        const isPublicPath = publicPaths.some(
          (publicPath) => path === publicPath || path.startsWith(`${publicPath}/`)
        )

        if (isPublicPath) return true

        return !!token
      },
    },
  }
)

export const config = {
  matcher: ["/admin/:path*", "/organization/:path*", "/house/:path*"],
}