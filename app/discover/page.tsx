// app/discover/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { 
  Building2, 
  Calendar, 
  Search,
  ArrowRight,
  Globe,
  CheckCircle,
  Users,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface DiscoverPageProps {
  searchParams: {
    search?: string
    page?: string
  }
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const page = parseInt(searchParams.page || '1')
  const limit = 12
  const search = searchParams.search || ''

  // Debug: Check what houses exist
  const allHouses = await prisma.house.findMany({
    include: {
      organization: true,
    }
  })
  
  console.log('All houses in DB:', allHouses.length)
  console.log('Private houses:', allHouses.filter(h => h.isPrivate).length)
  console.log('Public houses:', allHouses.filter(h => !h.isPrivate).length)

  // Simplified where clause - only filter by isPrivate
  const where: any = {
    isPrivate: false,
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { organization: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [houses, total, totalOrgs, totalEvents] = await Promise.all([
    prisma.house.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
            description: true,
            status: true,
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
        },
        _count: {
          select: {
            events: true,
          }
        }
      }
    }),
    prisma.house.count({ where }),
    prisma.organization.count(),
    prisma.event.count({ 
      where: { 
        house: { isPrivate: false },
        status: 'PUBLISHED' 
      } 
    }),
  ])

  console.log('Filtered houses:', houses.length)
  console.log('Organizations count:', totalOrgs)

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-100 hover:text-white mb-6 transition"
          >
            <ArrowRight className="h-4 w-4 rotate-180 mr-2" />
            Back to Home
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Communities</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Find and join amazing organizations and connect with like-minded people
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-8 mt-8 max-w-md">
            <div>
              <p className="text-3xl font-bold">{totalOrgs}</p>
              <p className="text-blue-100 text-sm">Organizations</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{total}</p>
              <p className="text-blue-100 text-sm">Communities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search by house name or organization..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {houses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No communities found</h3>
            <p className="text-gray-500 mb-4">
              {allHouses.length === 0 
                ? "No houses have been created yet. Create your first organization to get started!"
                : allHouses.filter(h => !h.isPrivate).length === 0
                ? "All houses are currently private. Make them public to appear here."
                : "No public houses available. Try adjusting your search or check back later."
              }
            </p>
            <div className="flex items-center justify-center gap-3">
              {search && (
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  Clear Search
                </Link>
              )}
              {allHouses.length === 0 && (
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Create Organization
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-gray-600">
                {search ? (
                  <>Found <span className="font-medium text-gray-900">{total}</span> communities matching "{search}"</>
                ) : (
                  <>Showing <span className="font-medium text-gray-900">{total}</span> communities</>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {houses.map((house) => {
                const primaryColor = house.organization.primaryColor || '#3B82F6'
                
                return (
                  <div key={house.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
                    {/* Cover Image */}
                    <div 
                      className="h-32 bg-gradient-to-br relative"
                      style={{ 
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` 
                      }}
                    >
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 text-xs font-medium bg-white/20 backdrop-blur-sm text-white rounded-full">
                          <Globe className="inline h-3 w-3 mr-1" />
                          Public
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      {/* Header with Logo */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 -mt-10">
                          {house.organization.logoUrl ? (
                            <img 
                              src={house.organization.logoUrl} 
                              alt={house.name}
                              className="w-16 h-16 rounded-xl border-4 border-white shadow-md object-cover"
                              suppressHydrationWarning
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl border-4 border-white shadow-md flex items-center justify-center">
                              <Building2 className="h-8 w-8 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">
                            {house.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {house.organization.name}
                          </p>
                        </div>
                      </div>

                      {/* Description - Set by admin */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-4">
                        {house.description || house.organization.description || 'Join this amazing community! Connect with like-minded people, attend exclusive events, and grow together.'}
                      </p>

                      {/* Features - Simple badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {house._count.events > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                            <Calendar className="h-3 w-3" />
                            Events
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                          <Users className="h-3 w-3" />
                          Community
                        </span>
                        {house.membershipPlans.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            Membership Plans
                          </span>
                        )}
                      </div>

                      {/* Single CTA Button */}
                      <Link
                        href={`/apply/${house.organization.slug}/${house.slug}`}
                        className="block w-full text-center py-3 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Become a Member
                        <ArrowRight className="inline h-4 w-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {page > 1 && (
                  <Link
                    href={`/discover?page=${page - 1}${search ? `&search=${search}` : ''}`}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = page
                    if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    
                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <Link
                          key={pageNum}
                          href={`/discover?page=${pageNum}${search ? `&search=${search}` : ''}`}
                          className={`px-4 py-2 text-sm font-medium rounded-lg ${
                            pageNum === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      )
                    }
                    return null
                  })}
                </div>
                
                {page < totalPages && (
                  <Link
                    href={`/discover?page=${page + 1}${search ? `&search=${search}` : ''}`}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Own Community?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Create your organization and start building your community today.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-blue-600 bg-white rounded-lg hover:bg-gray-100 transition"
          >
            <Building2 className="h-5 w-5" />
            Create Your Organization
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}