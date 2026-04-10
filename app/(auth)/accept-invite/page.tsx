// app/(auth)/accept-invite/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Eye, EyeOff, Lock, Building2, Home, Mail } from 'lucide-react'

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type PasswordForm = z.infer<typeof passwordSchema>

interface InviteData {
  userId: string
  email: string
  name: string
  role: string
  organizationId: string
  organizationName: string
  houseId: string
  houseName: string
  needsPassword: boolean
}

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'verify' | 'set-password' | 'success' | 'error'>('loading')
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  // Step 1: Verify the token
  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Invitation token is missing')
      return
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-invite?token=${token}`)
        const result = await response.json()

        if (!response.ok) {
          setStatus('error')
          setError(result.error || 'Invalid invitation')
          return
        }

        setInviteData(result.inviteData)
        
        if (result.inviteData.needsPassword) {
          setStatus('set-password')
        } else {
          // User already has password, auto-accept
          await acceptInvitation()
        }
      } catch (error) {
        setStatus('error')
        setError('Failed to verify invitation')
      }
    }

    verifyToken()
  }, [token])

  // Step 2: Accept invitation (with or without password)
  const acceptInvitation = async (password?: string) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const result = await response.json()

      if (!response.ok) {
        setStatus('error')
        setError(result.error || 'Failed to accept invitation')
        return
      }

      // If password was set, sign in the user
      if (password && inviteData?.email) {
        const signInResult = await signIn('credentials', {
          email: inviteData.email,
          password: password,
          redirect: false,
        })

        if (signInResult?.error) {
          console.error('Auto-login failed:', signInResult.error)
          // Still show success, user can manually login
        }
      }

      setStatus('success')
      toast.success(result.message || 'Invitation accepted!')
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(result.redirectUrl || '/dashboard')
      }, 2000)
    } catch (error) {
      setStatus('error')
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    await acceptInvitation(data.password)
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">Verifying your invitation...</h2>
          <p className="mt-2 text-gray-500">Please wait a moment</p>
        </div>
      </div>
    )
  }

  // Set Password Form
  if (status === 'set-password' && inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Set Up Your Account
            </h2>
            <p className="mt-2 text-gray-600">
              You've been invited to join as{' '}
              <span className="font-semibold">{inviteData.role}</span>
            </p>
          </div>

          {/* Invitation Details Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900 font-medium">{inviteData.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">{inviteData.organizationName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">{inviteData.houseName}</span>
              </div>
            </div>
          </div>

          {/* Password Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onPasswordSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Create Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Setting up...
                </>
              ) : (
                'Set Password & Accept Invitation'
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Invitation Accepted!</h2>
          <p className="mt-2 text-gray-600">Your account has been set up successfully.</p>
          <p className="mt-4 text-sm text-gray-500">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full text-center">
        <XCircle className="mx-auto h-16 w-16 text-red-500" />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Invalid Invitation</h2>
        <p className="mt-2 text-gray-600">{error}</p>
        <p className="mt-4 text-sm text-gray-500">
          This could be because the invitation has expired or was already accepted.
        </p>
        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}