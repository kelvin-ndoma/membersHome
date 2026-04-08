"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"

interface SignoutButtonProps {
  variant?: "default" | "mobile" | "text"
  className?: string
}

export default function SignoutButton({ variant = "default", className = "" }: SignoutButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignout = async () => {
    setIsLoading(true)
    
    try {
      // Call our API to log the signout
      await fetch("/api/auth/signout", {
        method: "POST",
      })
      
      // Sign out from NextAuth and redirect to signout page
      await signOut({ redirect: false })
      router.push("/signout")
    } catch (error) {
      console.error("Signout error:", error)
      // Fallback signout
      await signOut({ callbackUrl: "/" })
    } finally {
      setIsLoading(false)
    }
  }

  if (variant === "text") {
    return (
      <button
        onClick={handleSignout}
        disabled={isLoading}
        className={`text-gray-600 hover:text-gray-900 transition ${className}`}
      >
        {isLoading ? "Signing out..." : "Sign out"}
      </button>
    )
  }

  if (variant === "mobile") {
    return (
      <button
        onClick={handleSignout}
        disabled={isLoading}
        className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition ${className}`}
      >
        {isLoading ? "Signing out..." : "Sign out"}
      </button>
    )
  }

  // Default button
  return (
    <button
      onClick={handleSignout}
      disabled={isLoading}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition ${className}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Signing out...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </>
      )}
    </button>
  )
}