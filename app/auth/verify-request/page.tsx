import { Metadata } from 'next'
import { Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Check Your Email - MembersHome',
  description: 'Verify your email address',
}

export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h2 className="mt-4 text-2xl font-bold">Check your email</h2>
        <p className="mt-2 text-muted-foreground">
          A sign in link has been sent to your email address.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Didn't receive the email?{' '}
          <a href="/auth/login" className="font-medium text-primary hover:underline">
            Try again
          </a>
        </p>
        <div className="mt-6">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}