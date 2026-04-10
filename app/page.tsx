// app/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Calendar, 
  Ticket, 
  BarChart3, 
  Shield, 
  Globe, 
  CreditCard,
  Building2,
  Search,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export default async function HomePage() {
  // Fetch public houses for display
  const featuredHouses = await prisma.house.findMany({
    where: {
      isPrivate: false,
      organization: {
        status: 'ACTIVE'
      }
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
        }
      },
      _count: {
        select: {
          members: true,
          events: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })

  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">MembersHome</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/discover" className="text-gray-600 hover:text-gray-900">
                Discover
              </Link>
              <Link href="#features" className="text-gray-600 hover:text-gray-900">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Manage Your Membership
            <span className="text-blue-600 block">Organization With Ease</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            All-in-one platform for membership management, event ticketing, and community engagement. 
            Streamline operations and grow your organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition inline-flex items-center justify-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/discover"
              className="bg-white text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold border border-gray-300 hover:border-gray-400 transition inline-flex items-center justify-center"
            >
              <Search className="mr-2 h-5 w-5" />
              Discover Communities
            </Link>
          </div>
          <div className="mt-8 text-sm text-gray-500">
            No credit card required • 14-day free trial
          </div>
        </div>
      </section>

      {/* Featured Houses Section */}
      {featuredHouses.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Discover Amazing Communities
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Join these thriving organizations and connect with like-minded people
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredHouses.map((house) => (
                <Link
                  key={house.id}
                  href={`/${house.organization.slug}/${house.slug}`}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all"
                >
                  {/* Cover Image / Gradient */}
                  <div 
                    className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative"
                    style={house.organization.primaryColor ? {
                      background: `linear-gradient(135deg, ${house.organization.primaryColor} 0%, ${house.organization.primaryColor}dd 100%)`
                    } : undefined}
                  >
                    <div className="absolute inset-0 bg-black/10" />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Logo */}
                      <div className="flex-shrink-0 -mt-10">
                        {house.organization.logoUrl ? (
                          <img 
                            src={house.organization.logoUrl} 
                            alt={house.name}
                            className="w-16 h-16 rounded-xl border-4 border-white shadow-md object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl border-4 border-white shadow-md flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition truncate">
                          {house.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {house.organization.name}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {house.description && (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                        {house.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{house._count.members} members</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{house._count.events} events</span>
                      </div>
                    </div>

                    {/* Join CTA */}
                    <div className="mt-4">
                      <span className="inline-flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                        View Community
                        <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* View All Link */}
            <div className="text-center mt-10">
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              >
                <Globe className="h-5 w-5" />
                Discover More Communities
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Organization
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed for membership-based organizations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How MembersHome Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in minutes and scale as you grow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your organization
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`p-8 rounded-2xl border ${
                  plan.featured
                    ? 'border-blue-600 shadow-lg scale-105 bg-white'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.featured && (
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3 px-6 rounded-lg font-semibold transition ${
                    plan.featured
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Membership Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of organizations using MembersHome to streamline operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition inline-flex items-center"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/discover"
              className="bg-transparent text-white border border-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition inline-flex items-center"
            >
              <Search className="mr-2 h-5 w-5" />
              Discover Communities
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">MembersHome</h3>
              <p className="text-sm">
                Complete membership management platform for modern organizations.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/discover" className="hover:text-white">Discover</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms</Link></li>
                <li><Link href="#" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            <p>&copy; {new Date().getFullYear()} MembersHome. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}

const features = [
  {
    icon: Users,
    title: 'Member Management',
    description: 'Track members, manage profiles, and handle applications with ease.',
  },
  {
    icon: Calendar,
    title: 'Event Management',
    description: 'Create and promote events, manage RSVPs, and track attendance.',
  },
  {
    icon: Ticket,
    title: 'Ticketing System',
    description: 'Sell tickets online with multiple pricing tiers and member discounts.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Get insights into membership growth, revenue, and engagement.',
  },
  {
    icon: CreditCard,
    title: 'Payment Processing',
    description: 'Accept payments for memberships, events, and donations securely.',
  },
  {
    icon: Globe,
    title: 'Custom Domains',
    description: 'Use your own domain for a fully branded experience.',
  },
  {
    icon: Shield,
    title: 'Multi-Tenant Architecture',
    description: 'Manage multiple houses or chapters under one organization.',
  },
  {
    icon: Users,
    title: 'Member Portal',
    description: 'Give members their own dashboard for self-service.',
  },
]

const steps = [
  {
    title: 'Create Your Organization',
    description: 'Sign up and set up your organization profile in minutes.',
  },
  {
    title: 'Configure Settings',
    description: 'Customize membership plans, create houses, and set up your portal.',
  },
  {
    title: 'Launch & Grow',
    description: 'Start accepting members, selling tickets, and building your community.',
  },
]

const pricingPlans = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    features: [
      'Up to 50 members',
      '1 house',
      'Basic event management',
      'Email support',
      'Community features',
    ],
    featured: false,
  },
  {
    name: 'Professional',
    price: 49,
    description: 'For growing organizations',
    features: [
      'Up to 500 members',
      '5 houses',
      'Advanced event management',
      'Ticket sales',
      'Custom branding',
      'Priority support',
      'Analytics dashboard',
    ],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 199,
    description: 'For large organizations',
    features: [
      'Unlimited members',
      'Unlimited houses',
      'Custom domain',
      'API access',
      'Dedicated support',
      'SLA guarantee',
      'Advanced security',
    ],
    featured: false,
  },
]