"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function UnauthorizedPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  
  let message = "You don't have permission to access this page."
  
  if (error === "house_access_denied") {
    message = "You don't have access to this house."
  } else if (error === "admin_access_denied") {
    message = "You need admin privileges to access this page."
  } else if (error === "no_organization") {
    message = "You haven't joined any organization yet."
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-9xl font-bold text-gray-300">403</h1>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Unauthorized Access</h2>
          <p className="mt-2 text-gray-600">{message}</p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-block w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}