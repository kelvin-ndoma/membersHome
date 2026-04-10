// app/org/[orgSlug]/houses/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { 
  Home, 
  Plus, 
  Users, 
  Calendar,
  ArrowRight,
  Settings,
  Eye,
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

      {/* Houses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organization.houses.map((house) => (
          <div key={house.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{house.name}</h3>
                  <p className="text-sm text-gray-500">{house.slug}</p>
                </div>
              </div>
              {house.isPrivate && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                  Private
                </span>
              )}
            </div>

            {house.description && (
              <p className="text-sm text-gray-600 mb-4">{house.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {house._count.members} members
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {house._count.events} events
              </span>
            </div>

            {house.members.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Managers:</p>
                <div className="flex flex-wrap gap-2">
                  {house.members.map((manager) => (
                    <span key={manager.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {manager.membership.user.name || manager.membership.user.email}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
              <Link
                href={`/org/${params.orgSlug}/houses/${house.slug}/dashboard`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              >
                <Eye className="h-4 w-4" />
                View House
              </Link>
              <Link
                href={`/org/${params.orgSlug}/houses/${house.slug}/settings`}
                className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {organization.houses.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No houses yet</h3>
          <p className="text-gray-500 mb-4">Create your first house to get started</p>
          <Link
            href={`/org/${params.orgSlug}/houses/create`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create House
          </Link>
        </div>
      )}
    </div>
  )
}