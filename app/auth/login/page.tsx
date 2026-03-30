import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Sign In - MembersHome',
  description: 'Sign in to your account',
}

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    // Redirect based on role
    if (session.user.platformRole === "PLATFORM_ADMIN") {
      redirect("/admin")
    }
    redirect("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Or{' '}
            <a href="/auth/register" className="font-medium text-primary hover:underline">
              create a new account
            </a>
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}