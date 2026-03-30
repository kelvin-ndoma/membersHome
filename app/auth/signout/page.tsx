'use client'

import { signOut } from 'next-auth/react'
import { useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function SignOutPage() {
  useEffect(() => {
    signOut({ callbackUrl: '/' })
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}