import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request })
  
  if (token) {
    // Redirect to home after sign out
    const response = NextResponse.redirect(new URL("/", request.url))
    
    // Clear the session cookie
    response.cookies.delete("next-auth.session-token")
    response.cookies.delete("__Secure-next-auth.session-token")
    
    return response
  }
  
  return NextResponse.redirect(new URL("/", request.url))
}