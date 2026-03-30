import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Sign Up - MembersHome',
  description: 'Create a new account',
}

export default async function RegisterPage() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/auth/login" className="font-medium text-primary hover:underline">
              Sign in
            </a>
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}