import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Allow signout page without auth
    if (path === "/signout") {
      return NextResponse.next()
    }

    // Platform admin routes
    if (path.startsWith("/platform")) {
      if (!token || token.platformRole !== "PLATFORM_ADMIN") {
        const url = new URL("/unauthorized", req.url)
        url.searchParams.set("callbackUrl", path)
        return NextResponse.redirect(url)
      }
    }

    // Organization routes
    if (path.startsWith("/org/")) {
      if (!token) {
        const url = new URL("/login", req.url)
        url.searchParams.set("callbackUrl", path)
        return NextResponse.redirect(url)
      }
      
      if (!token.memberships || token.memberships.length === 0) {
        const url = new URL("/dashboard", req.url)
        url.searchParams.set("error", "no_organization")
        return NextResponse.redirect(url)
      }
    }

    // House routes (Portal & Admin)
    if (path.match(/\/house\/[^/]+\/[^/]+\/(portal|admin)/)) {
      if (!token) {
        const url = new URL("/login", req.url)
        url.searchParams.set("callbackUrl", path)
        return NextResponse.redirect(url)
      }
      
      const parts = path.split("/")
      const orgSlug = parts[2]
      const houseSlug = parts[3]
      
      const hasAccess = token.memberships?.some(membership => 
        membership.organization.slug === orgSlug &&
        membership.houseMemberships?.some(hm => hm.house.slug === houseSlug)
      )
      
      if (!hasAccess) {
        const url = new URL("/unauthorized", req.url)
        url.searchParams.set("error", "house_access_denied")
        return NextResponse.redirect(url)
      }
      
      if (path.includes("/admin/")) {
        const isHouseAdmin = token.memberships?.some(membership =>
          membership.organization.slug === orgSlug &&
          membership.houseMemberships?.some(hm => 
            hm.house.slug === houseSlug && 
            (hm.role === "HOUSE_ADMIN" || hm.role === "HOUSE_MANAGER")
          )
        )
        
        if (!isHouseAdmin) {
          const url = new URL("/unauthorized", req.url)
          url.searchParams.set("error", "admin_access_denied")
          return NextResponse.redirect(url)
        }
      }
    }

    // Auth pages - Redirect if already logged in
    const authPages = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"]
    if (authPages.includes(path) && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // API route protection
    if (path.startsWith("/api/") && !path.startsWith("/api/auth") && !path.startsWith("/api/webhooks")) {
      if (!token) {
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        )
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        
        // Completely public routes
        const publicPaths = [
          "/",
          "/login",
          "/register", 
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/signout",
          "/api/auth",
          "/api/webhooks"
        ]
        
        const isPublicPath = publicPaths.some(publicPath => 
          path === publicPath || path.startsWith(publicPath + "/")
        )
        
        const isStaticFile = path.match(/\.(svg|png|jpg|jpeg|gif|webp|css|js)$/)
        
        if (isPublicPath || isStaticFile) {
          return true
        }
        
        return !!token
      },
    },
    pages: {
      signIn: "/login",
      error: "/login",
    },
  }
)

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhooks).*)",
  ],
}