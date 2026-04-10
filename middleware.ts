// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const path = req.nextUrl.pathname

  // Clone the request headers and add the pathname
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', path)

  // Public routes - allow access
  const publicPaths = ['/login', '/register', '/', '/api/auth', '/verify-email', '/forgot-password', '/reset-password', '/accept-invite']
  if (publicPaths.some(p => path.startsWith(p))) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Check if user is authenticated
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}