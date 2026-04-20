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
  Palette,
  ShoppingBag,
  DollarSign,
  CreditCard,
} from 'lucide-react'
import GeneralSettings from '@/components/house/settings/GeneralSettings'
import TeamSettings from '@/components/house/settings/TeamSettings'
import PortalSettings from '@/components/house/settings/PortalSettings'
import DangerZone from '@/components/house/settings/DangerZone'
import PrivacySettings from '@/components/house/settings/PrivacySettings'
import BrandingSettings from '@/components/house/settings/BrandingSettings'
import MarketplaceSettings from '@/components/house/settings/MarketplaceSettings'
import PayoutSettings from '@/components/house/settings/PayoutSettings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
          accentColor: true,
          backgroundColor: true,
          textColor: true,
          borderRadius: true,
          buttonStyle: true,
          fontFamily: true,
          logoUrl: true,
          useCustomBranding: true,
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

  // Check if user has access to settings
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

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-white border border-gray-200 rounded-lg p-1 flex flex-wrap gap-1">
          <TabsTrigger value="general" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            <Home className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="branding" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            <CreditCard className="h-4 w-4 mr-2" />
            Payouts
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="portal" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            <Globe className="h-4 w-4 mr-2" />
            Portal
          </TabsTrigger>
          <TabsTrigger value="privacy" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            <Shield className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6">
              <GeneralSettings 
                orgSlug={params.orgSlug}
                houseSlug={params.houseSlug}
                house={house} 
              />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="branding">
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Palette className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">House Branding</h2>
                  <p className="text-sm text-gray-500">Customize this house's appearance including logo</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <BrandingSettings 
                orgSlug={params.orgSlug}
                houseSlug={params.houseSlug}
                houseId={house.id}
                house={{
                  theme: house.theme,
                  logoUrl: house.logoUrl,
                  name: house.name
                }}
              />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="marketplace">
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Marketplace Settings</h2>
                  <p className="text-sm text-gray-500">Configure commission and product approval for community marketplaces</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <MarketplaceSettings 
                orgSlug={params.orgSlug}
                houseSlug={params.houseSlug}
                houseId={house.id}
                initialFeePercent={house.marketplaceFeePercent || 5}
                initialAutoApprove={house.autoApproveProducts || false}
              />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="payouts">
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Payout Settings</h2>
                  <p className="text-sm text-gray-500">Configure how you receive marketplace earnings</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <PayoutSettings 
                houseId={house.id}
                houseSlug={house.slug}
                orgSlug={params.orgSlug}
                stripeConnectAccountId={house.stripeConnectAccountId || null}
                stripeAccountStatus={house.stripeAccountStatus || null}
                marketplaceFeePercent={house.marketplaceFeePercent || 5}
                payoutSchedule={house.payoutSchedule || 'manual'}
                minimumPayoutAmount={house.minimumPayoutAmount || 25}
              />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="team">
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
        </TabsContent>

        <TabsContent value="portal">
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
        </TabsContent>

        <TabsContent value="privacy">
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
              <PrivacySettings 
                orgSlug={params.orgSlug}
                houseSlug={params.houseSlug}
                house={{
                  id: house.id,
                  isPrivate: house.isPrivate
                }} 
              />
            </div>
          </section>
        </TabsContent>
      </Tabs>

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
  )
}