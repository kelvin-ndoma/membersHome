// components/layout/Footer.tsx
import Link from 'next/link'
import { Users, Shield, Zap, CreditCard, Mail } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 py-16">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-foreground rounded-2xl flex items-center justify-center shadow-lg" />
              <div>
                <h3 className="font-black text-2xl bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  membersHome
                </h3>
                <p className="text-sm text-muted-foreground">Modern membership platform</p>
              </div>
            </div>
            <div className="flex gap-2 text-muted-foreground">
              <a href="https://twitter.com" className="hover:text-primary transition-colors">Twitter</a>
              <span>•</span>
              <a href="https://github.com" className="hover:text-primary transition-colors">GitHub</a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-6 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Product
            </h4>
            <div className="space-y-3 text-sm">
              <Link href="/platform" className="block hover:text-primary transition-colors">Dashboard</Link>
              <Link href="/platform/organizations" className="block hover:text-primary transition-colors">Organizations</Link>
              <Link href="/features" className="block hover:text-primary transition-colors">Features</Link>
              <Link href="/pricing" className="block hover:text-primary transition-colors">Pricing</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-6 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Company
            </h4>
            <div className="space-y-3 text-sm">
              <Link href="/about" className="block hover:text-primary transition-colors">About</Link>
              <Link href="/careers" className="block hover:text-primary transition-colors">Careers</Link>
              <Link href="/blog" className="block hover:text-primary transition-colors">Blog</Link>
              <Link href="/contact" className="block hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-6 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Legal
            </h4>
            <div className="space-y-3 text-sm">
              <Link href="/privacy" className="block hover:text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="block hover:text-primary transition-colors">Terms</Link>
              <Link href="/security" className="block hover:text-primary transition-colors">Security</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border/20 pt-8 pb-12 text-center text-sm text-muted-foreground md:flex md:justify-between md:items-center">
          <p>&copy; {currentYear} membersHome. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row items-center gap-6 mt-6 md:mt-0">
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              <span>Powered by Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}