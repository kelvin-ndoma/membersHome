"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import SignoutButton from "@/components/auth/SignoutButton"

export default function PlaceholderDashboard() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600">membersHome</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{session?.user?.email}</span>
              <SignoutButton variant="text" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏠</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to membersHome!</h1>
            <p className="text-gray-600 mb-4">
              Your email has been verified and you're logged in.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-yellow-800">
                <strong>Organization Dashboard Coming Soon</strong>
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                The organization dashboard is currently under development. 
                You can now access the platform admin section if you have admin privileges.
              </p>
            </div>
            {session?.user?.platformRole === "PLATFORM_ADMIN" && (
              <Link 
                href="/platform/dashboard"
                className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Go to Platform Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}