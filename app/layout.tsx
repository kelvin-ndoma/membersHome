// app/layout.tsx - Updated
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/auth-provider'
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MembersHome - Community Management Platform',
  description: 'A multi-tenant SaaS platform for managing organizations, houses, and memberships',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  
  // If user is logged in and trying to access root, redirect to their organization
  if (session?.user) {
    // We'll handle this logic in middleware
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}