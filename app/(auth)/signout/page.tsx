"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SignoutPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    const performSignout = async () => {
      setIsSigningOut(true)
      
      // Call our API to log the signout
      await fetch("/api/auth/signout", {
        method: "POST",
      })
      
      // Sign out from NextAuth
      await signOut({ redirect: false })
      
      // Start countdown
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            router.push("/")
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    performSignout()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-blue-600">membersHome</h1>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Signed Out</h2>
          <p className="mt-2 text-gray-600">
            You have been successfully signed out.
          </p>
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Countdown */}
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Redirecting to homepage in {countdown} seconds...
          </p>
          
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Homepage Now
            </Link>
            
            <Link
              href="/login"
              className="inline-block w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign In Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}