// app/layout.tsx
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Providers } from './providers'
import ThemeFetcher from '@/components/theme/ThemeFetcher'  // Changed to default import

export const metadata = {
  title: 'MembersHome - Membership Management Platform',
  description: 'Complete membership management for organizations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeFetcher>
          <Providers>
            {children}
            <Toaster position="top-right" />
          </Providers>
        </ThemeFetcher>
      </body>
    </html>
  )
}