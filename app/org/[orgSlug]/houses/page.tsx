// app/org/[orgSlug]/houses/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Home, 
  Plus, 
  Users, 
  Calendar,
  Settings,
  Eye,
  ArrowRight,
} from 'lucide-react'

interface HousesPageProps {
  params: {
    orgSlug: string
  }
}

export default async function HousesPage({ params }: HousesPageProps) {
  const organization = await prisma.organization.findUnique({
    where: { slug: params.orgSlug },
    include: {
      houses: {
        include: {
          _count: {
            select: {
              members: true,
              events: true,
            }
          },
          members: {
            where: { role: 'HOUSE_MANAGER' },
            include: {
              membership: {
                include: {
                  user: {
                    select: { name: true, email: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!organization) {
    return <div>Organization not found</div>
  }

  // Helper function to get house logo from theme
  const getHouseLogo = (house: any) => {
    const theme = house.theme as any || {}
    // Priority: custom house logo from theme > house logoUrl > null
    return theme.logoUrl || house.logoUrl || null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Houses</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all houses in {organization.name}
          </p>
        </div>
        <Link
          href={`/org/${params.orgSlug}/houses/create`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          Create House
        </Link>
      </div>

      {/* Houses Grid - Updated with larger logos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organization.houses.map((house) => {
          const houseLogo = getHouseLogo(house)
          
          return (
            <div key={house.id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              {/* Hero Section with Logo */}
              <div className="relative h-32 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                {/* Large Logo Container */}
                <div className="absolute -bottom-8 left-6">
                  {houseLogo ? (
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-white border-4 border-white shadow-lg">
                      <Image
                        src={houseLogo}
                        alt={house.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-contain p-2 bg-white"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg border-4 border-white">
                      <Home className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Private Badge */}
                {house.isPrivate && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-900/80 text-white rounded-full backdrop-blur-sm">
                      Private
                    </span>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="pt-12 p-6">
                {/* House Name and Slug */}
                <div className="mb-3">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {house.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">/{house.slug}</p>
                </div>

                {/* Description */}
                {house.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {house.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{house._count.members}</span>
                    <span className="text-gray-500">members</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">{house._count.events}</span>
                    <span className="text-gray-500">events</span>
                  </div>
                </div>

                {/* Managers */}
                {house.members.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      House Managers
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {house.members.slice(0, 3).map((manager) => (
                        <span 
                          key={manager.id} 
                          className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium"
                        >
                          {manager.membership.user.name?.split(' ')[0] || manager.membership.user.email?.split('@')[0] || 'Manager'}
                        </span>
                      ))}
                      {house.members.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                          +{house.members.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    href={`/org/${params.orgSlug}/houses/${house.slug}/dashboard`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all hover:shadow-md"
                  >
                    <Eye className="h-4 w-4" />
                    View House
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/org/${params.orgSlug}/houses/${house.slug}/settings`}
                    className="inline-flex items-center justify-center p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    title="House Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {organization.houses.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Home className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No houses yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Create your first house to start managing members, events, and more.
          </p>
          <Link
            href={`/org/${params.orgSlug}/houses/create`}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Create Your First House
          </Link>
        </div>
      )}
    </div>
  )
}