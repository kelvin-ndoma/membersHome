// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  
  // Skip middleware for API routes, static files, and Next.js internals
  if (
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // Clone the request headers and add the pathname
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', path)

  // Public routes - allow access without authentication
  const publicPaths = [
    '/login', 
    '/register', 
    '/', 
    '/verify-email', 
    '/forgot-password', 
    '/reset-password', 
    '/accept-invite',
    '/discover',
    '/apply'
  ]
  
  // Check if it's a public house page: /orgSlug/houseSlug (no /org/ prefix)
  const isPublicHousePage = path.match(/^\/[^\/]+\/[^\/]+$/) && 
                            !path.startsWith('/org') && 
                            !path.startsWith('/portal') &&
                            !path.startsWith('/platform')
  
  const isPublicPath = publicPaths.some(p => path.startsWith(p)) || 
                       isPublicHousePage ||
                       path.startsWith('/forms/')
  
  if (isPublicPath) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Check if user is authenticated for protected routes
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(loginUrl)
  }

  // Platform routes - only platform admins
  if (path.startsWith('/platform')) {
    if (token.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}