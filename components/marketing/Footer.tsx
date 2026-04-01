import Link from "next/link"
import { Building2, Mail, Phone, MapPin } from "lucide-react"

const footerLinks = {
  Product: [
    { href: "/marketing/features", label: "Features" },
    { href: "/marketing/pricing", label: "Pricing" },
    { href: "/events", label: "Events" },
  ],
  Company: [
    { href: "/marketing/about", label: "About Us" },
    { href: "/marketing/contact", label: "Contact" },
    { href: "/marketing/blog", label: "Blog" },
  ],
  Legal: [
    { href: "/marketing/legal/privacy", label: "Privacy Policy" },
    { href: "/marketing/legal/terms", label: "Terms of Service" },
    { href: "/marketing/legal/cookies", label: "Cookie Policy" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">MembersHome</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Helping communities grow and thrive through powerful membership management tools.
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>support@membershome.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MembersHome. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}