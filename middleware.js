import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = [
    "/",
    "/auth/login",
    "/auth/register", 
    "/auth/error",
    "/auth/verify-request",
    "/api/auth",
    "/marketing",
    "/_next",
    "/favicon.ico",
  ]

  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + "/")
  )

  // Allow access to public paths
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check platform admin routes
  if (pathname.startsWith("/platform/admin")) {
    if (token.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}