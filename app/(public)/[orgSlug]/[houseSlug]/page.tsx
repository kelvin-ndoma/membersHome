// app/(public)/[orgSlug]/[houseSlug]/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Ticket, 
  ArrowRight,
  CheckCircle,
  Star,
  Clock,
  Globe,
  Mail,
  Phone,
  Building2,
} from 'lucide-react'
import Image from 'next/image'

interface PublicHousePageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
}

export default async function PublicHousePage({ params }: PublicHousePageProps) {
  const house = await prisma.house.findFirst({
    where: {
      slug: params.houseSlug,
      organization: { slug: params.orgSlug },
      isPrivate: false, // Only show public houses
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          website: true,
          primaryColor: true,
          secondaryColor: true,
        }
      },
      memberPortal: {
        select: {
          welcomeMessage: true,
          theme: true,
        }
      },
      _count: {
        select: {
          members: true,
          events: true,
        }
      },
      events: {
        where: {
          status: 'PUBLISHED',
          startDate: { gte: new Date() },
          memberOnly: false,
        },
        orderBy: { startDate: 'asc' },
        take: 3,
        include: {
          _count: {
            select: { rsvps: true }
          }
        }
      },
      membershipPlans: {
        where: {
          status: 'ACTIVE',
          isPublic: true,
        },
        include: {
          prices: {
            orderBy: { amount: 'asc' }
          }
        },
        take: 3,
      }
    }
  })

  if (!house) {
    notFound()
  }

  const primaryColor = house.organization.primaryColor || '#3B82F6'
  const secondaryColor = house.organization.secondaryColor || '#1E40AF'

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20">
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Logo/Avatar */}
            {house.organization.logoUrl ? (
              <img 
                src={house.organization.logoUrl} 
                alt={house.name}
                className="h-20 w-20 rounded-2xl mx-auto mb-6 object-cover"
              />
            ) : (
              <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-white" />
              </div>
            )}
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{house.name}</h1>
            <p className="text-lg text-gray-300 mb-8">
              {house.description || `Welcome to ${house.name}, part of ${house.organization.name}`}
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Link
                href={`/apply/${params.orgSlug}/${params.houseSlug}`}
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white rounded-lg transition"
                style={{ backgroundColor: primaryColor }}
              >
                <Users className="h-5 w-5" />
                Join Now
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href={`/${params.orgSlug}/${params.houseSlug}/events`}
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition"
              >
                <Calendar className="h-5 w-5" />
                View Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-4xl font-bold text-gray-900">{house._count.members}</p>
              <p className="text-gray-600">Active Members</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-4xl font-bold text-gray-900">{house._count.events}</p>
              <p className="text-gray-600">Events Hosted</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-4xl font-bold text-gray-900">4.9</p>
              <p className="text-gray-600">Member Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome Message */}
      {house.memberPortal?.welcomeMessage && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Welcome</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {house.memberPortal.welcomeMessage}
            </p>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {house.events.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
                <p className="text-gray-600 mt-2">Join us at our next events</p>
              </div>
              <Link
                href={`/${params.orgSlug}/${params.houseSlug}/events`}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View all events
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {house.events.map((event) => (
                <Link
                  key={event.id}
                  href={`/${params.orgSlug}/${params.houseSlug}/events/${event.slug || event.id}`}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition group"
                >
                  {event.imageUrl ? (
                    <img 
                      src={event.imageUrl} 
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-white opacity-50" />
                    </div>
                  )}
                  
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {event.description || 'No description available'}
                    </p>
                    
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(event.startDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })} at {' '}
                          {new Date(event.startDate).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{event._count.rsvps} attending</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Membership Plans */}
      {house.membershipPlans.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Membership Plans</h2>
              <p className="text-lg text-gray-600">Choose the plan that works for you</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {house.membershipPlans.map((plan) => {
                const lowestPrice = plan.prices[0]
                const features = (plan.features as string[]) || []
                
                return (
                  <div key={plan.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{plan.description || 'Great for getting started'}</p>
                    
                    {lowestPrice && (
                      <div className="mb-6">
                        <p className="text-3xl font-bold text-gray-900">
                          {lowestPrice.currency} {lowestPrice.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          per {lowestPrice.billingFrequency.toLowerCase().replace('_', ' ')}
                        </p>
                      </div>
                    )}
                    
                    {features.length > 0 && (
                      <ul className="space-y-2 mb-6">
                        {features.slice(0, 4).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    <Link
                      href={`/apply/${params.orgSlug}/${params.houseSlug}?plan=${plan.id}`}
                      className="block w-full text-center px-4 py-2 text-sm font-medium text-white rounded-lg transition"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Select Plan
                    </Link>
                  </div>
                )
              })}
            </div>
            
            <div className="text-center mt-8">
              <Link
                href={`/${params.orgSlug}/${params.houseSlug}/membership`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Compare all plans →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {house.organization.description && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">About {house.organization.name}</h2>
            <p className="text-lg text-gray-600 leading-relaxed text-center">
              {house.organization.description}
            </p>
            
            {house.organization.website && (
              <div className="text-center mt-6">
                <a 
                  href={house.organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Globe className="h-4 w-4" />
                  Visit Website
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 text-white" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Join {house.name}?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Become a member today and get access to exclusive events, community, and more.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href={`/apply/${params.orgSlug}/${params.houseSlug}`}
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition"
            >
              <Users className="h-5 w-5" />
              Apply for Membership
            </Link>
            <Link
              href={`/${params.orgSlug}/${params.houseSlug}/about`}
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium bg-transparent border border-white rounded-lg hover:bg-white/10 transition"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}