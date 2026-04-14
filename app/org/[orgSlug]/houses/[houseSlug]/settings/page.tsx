// app/org/[orgSlug]/houses/[houseSlug]/settings/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { 
  Home,
  Users, 
  Globe, 
  Shield,
  AlertTriangle,
} from 'lucide-react'
import GeneralSettings from '@/components/house/settings/GeneralSettings'
import TeamSettings from '@/components/house/settings/TeamSettings'
import PortalSettings from '@/components/house/settings/PortalSettings'
import DangerZone from '@/components/house/settings/DangerZone'
import PrivacySettings from '@/components/house/settings/PrivacySettings'

interface HouseSettingsPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
}

export default async function HouseSettingsPage({ params }: HouseSettingsPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const house = await prisma.house.findFirst({
    where: {
      slug: params.houseSlug,
      organization: { slug: params.orgSlug }
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          primaryColor: true,
          secondaryColor: true,
        }
      },
      members: {
        where: {
          role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN', 'HOUSE_STAFF'] }
        },
        include: {
          membership: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                }
              }
            }
          }
        },
        orderBy: {
          role: 'asc'
        }
      },
      memberPortal: true,
    }
  })

  if (!house) {
    notFound()
  }

  // Check if user has access to settings (must be house manager, admin, or org owner/admin)
  const userMembership = await prisma.houseMembership.findFirst({
    where: {
      houseId: house.id,
      membership: { userId: session.user.id },
      role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN'] }
    }
  })

  const isOrgAdmin = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organizationId: house.organizationId,
      role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
    }
  })

  if (!userMembership && !isOrgAdmin) {
    redirect(`/org/${params.orgSlug}/houses/${params.houseSlug}/dashboard`)
  }

  const isOwner = !!isOrgAdmin
  
  // Ensure teamMembers is always an array
  const teamMembers = (house.members || []).map(m => ({
    id: m.id,
    userId: m.membership?.user?.id || '',
    name: m.membership?.user?.name || m.membership?.user?.email?.split('@')[0] || 'Unknown',
    email: m.membership?.user?.email || '',
    image: m.membership?.user?.image || null,
    role: m.role,
    status: m.status,
    joinedAt: m.joinedAt,
  }))

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">House Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage {house.name} settings and team members
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {house.isPrivate ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
              <Shield className="h-3 w-3" />
              Private House
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full">
              <Globe className="h-3 w-3" />
              Public House
            </span>
          )}
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* General Settings */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">General</h2>
                <p className="text-sm text-gray-500">Basic house information and settings</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <GeneralSettings house={house} />
          </div>
        </section>

        {/* Team Management */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Team Members</h2>
                <p className="text-sm text-gray-500">Invite and manage house managers and staff</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <TeamSettings 
              orgSlug={params.orgSlug}
              houseSlug={params.houseSlug}
              houseId={house.id}
              houseName={house.name}
              organizationId={house.organizationId}
              organizationName={house.organization.name}
              currentMembers={teamMembers}
              isOwner={isOwner}
            />
          </div>
        </section>

        {/* Member Portal Settings */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Member Portal</h2>
                <p className="text-sm text-gray-500">Customize the member portal experience</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <PortalSettings 
              orgSlug={params.orgSlug}
              houseSlug={params.houseSlug}
              houseId={house.id}
              portal={house.memberPortal}
            />
          </div>
        </section>

        {/* Privacy & Security */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Privacy & Security</h2>
                <p className="text-sm text-gray-500">Control access and visibility settings</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <PrivacySettings house={house} />
          </div>
        </section>

        {/* Danger Zone - Only visible to org owners */}
        {isOwner && (
          <section className="bg-white rounded-xl border border-red-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-red-200 bg-red-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-red-900">Danger Zone</h2>
                  <p className="text-sm text-red-700">Irreversible actions - only visible to organization owners</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <DangerZone 
                orgSlug={params.orgSlug}
                houseSlug={params.houseSlug}
                houseId={house.id}
                houseName={house.name}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  )
}