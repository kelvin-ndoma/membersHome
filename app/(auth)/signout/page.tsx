// app/(auth)/signout/page.tsx
'use client'

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignOutPage() {
  const router = useRouter()

  useEffect(() => {
    const performSignOut = async () => {
      await signOut({ redirect: false })
      router.push('/login?signedOut=true')
    }

    performSignOut()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="mt-6 text-xl font-semibold text-gray-900">
          Signing out...
        </h2>
      </div>
    </div>
  )
}