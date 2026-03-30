'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, string> = {
    default: 'An error occurred during authentication',
    Configuration: 'There is a problem with the server configuration',
    AccessDenied: 'You do not have permission to sign in',
    Verification: 'The verification link has expired or is invalid',
    OAuthSignin: 'Error starting the OAuth sign-in process',
    OAuthCallback: 'Error during OAuth callback',
    OAuthCreateAccount: 'Could not create OAuth account',
    EmailCreateAccount: 'Could not create email account',
    Callback: 'Error during callback',
    OAuthAccountNotLinked: 'Email already linked to another account',
    EmailSignin: 'Error sending email sign-in link',
    CredentialsSignin: 'Invalid credentials',
    SessionRequired: 'Please sign in to access this page',
  }

  const message = error ? errorMessages[error] || errorMessages.default : errorMessages.default

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-destructive">Authentication Error</h1>
        <p className="mt-2 text-muted-foreground">{message}</p>
        <div className="mt-6 flex gap-4 justify-center">
          <Link href="/auth/login">
            <Button>Back to Sign In</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}