"use client"

import { useEffect, useState } from "react"

export default function BillingPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch billing data
    setTimeout(() => setLoading(false), 500)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Platform Billing</h1>

      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-6xl mb-4">💰</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Billing Dashboard Coming Soon</h2>
        <p className="text-gray-500">
          Stripe Connect integration, subscription management, and revenue tracking are under development.
        </p>
      </div>
    </div>
  )
}