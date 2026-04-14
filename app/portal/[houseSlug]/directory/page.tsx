// app/portal/[houseSlug]/directory/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Search,
  Users,
  Mail,
  Building2,
  MapPin,
  Briefcase,
  Code,
  Heart,
  Globe,
  ChevronRight,
  User,
  Shield,
  Crown,
} from 'lucide-react'

interface DirectoryPageProps {
  params: {
    houseSlug: string
  }
  searchParams: {
    page?: string
    search?: string
    role?: string
  }
}

export default async function DirectoryPage({ params, searchParams }: DirectoryPageProps) {
  const { houseSlug } = await Promise.resolve(params)
  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const search = searchParams.search || ''
  const role = searchParams.role

  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  // Find the house through user's memberships
  const userMemberships = await prisma.membership.findMany({
    where: {
      userId: session.user.id,
      status: 'ACTIVE'
    },
    include: {
      organization: {
        select: { primaryColor: true, name: true }
      },
      houseMemberships: {
        where: {
          status: 'ACTIVE',
          house: { slug: houseSlug }
        },
        include: { house: true }
      }
    }
  })

  let targetHouse = null
  let memberAccess = null
  let primaryColor = '#8B5CF6'

  for (const membership of userMemberships) {
    const hm = membership.houseMemberships[0]
    if (hm) {
      targetHouse = hm.house
      memberAccess = hm
      primaryColor = membership.organization?.primaryColor || '#8B5CF6'
      break
    }
  }

  if (!targetHouse) {
    redirect('/portal/my-houses')
  }

  // Check if directory is enabled
  const memberPortal = await prisma.memberPortal.findUnique({
    where: { houseId: targetHouse.id }
  })

  const features = memberPortal?.features as any
  if (features && !features.enableDirectory) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Directory Disabled</h2>
          <p className="text-gray-500">
            The member directory is currently disabled for this house.
          </p>
        </div>
      </div>
    )
  }

  // Build where clause for members
  const where: any = {
    houseId: targetHouse.id,
    status: 'ACTIVE'
  }

  if (role) {
    where.role = role
  }

  if (search) {
    where.OR = [
      { membership: { user: { name: { contains: search, mode: 'insensitive' } } } },
      { membership: { user: { email: { contains: search, mode: 'insensitive' } } } },
      { memberProfile: { company: { contains: search, mode: 'insensitive' } } },
      { memberProfile: { jobTitle: { contains: search, mode: 'insensitive' } } },
    ]
  }

  // Get members
  const [members, total, roleCounts] = await Promise.all([
    prisma.houseMembership.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'desc' }
      ],
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
        },
        memberProfile: {
          select: {
            bio: true,
            jobTitle: true,
            company: true,
            industry: true,
            address: true,
            skills: true,
            interests: true,
            socialLinks: true,
            privacySettings: true,
          }
        }
      }
    }),
    prisma.houseMembership.count({ where }),
    prisma.houseMembership.groupBy({
      by: ['role'],
      where: { houseId: targetHouse.id, status: 'ACTIVE' },
      _count: true
    })
  ])

  const totalPages = Math.ceil(total / limit)

  // Role display config
  const roleConfig: Record<string, { label: string; icon: any; color: string }> = {
    HOUSE_MANAGER: { label: 'Manager', icon: Crown, color: 'bg-purple-100 text-purple-800' },
    HOUSE_ADMIN: { label: 'Admin', icon: Shield, color: 'bg-blue-100 text-blue-800' },
    HOUSE_STAFF: { label: 'Staff', icon: Shield, color: 'bg-green-100 text-green-800' },
    HOUSE_MEMBER: { label: 'Member', icon: User, color: 'bg-gray-100 text-gray-800' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Member Directory</h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} member{total !== 1 ? 's' : ''} in {targetHouse.name}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <form className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search by name, email, company, or job title..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </form>

          {/* Role Filter */}
          <div className="flex gap-2">
            <Link
              href={`/portal/${houseSlug}/directory${search ? `?search=${search}` : ''}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                !role ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({total})
            </Link>
            {roleCounts.map((r) => {
              const config = roleConfig[r.role] || { label: r.role.replace('HOUSE_', ''), color: 'bg-gray-100' }
              return (
                <Link
                  key={r.role}
                  href={`/portal/${houseSlug}/directory?role=${r.role}${search ? `&search=${search}` : ''}`}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                    role === r.role ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {config.label} ({r._count})
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Members Grid */}
      {members.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
          <p className="text-gray-500">
            {search ? 'Try adjusting your search filters' : 'No members match the criteria'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {members.map((member) => {
            const profile = member.memberProfile
            const user = member.membership.user
            const roleInfo = roleConfig[member.role] || { label: member.role, icon: User, color: 'bg-gray-100 text-gray-800' }
            const RoleIcon = roleInfo.icon
            const privacy = (profile?.privacySettings as any) || {}
            
            // Extract location from address JSON
            const address = (profile?.address as any) || {}
            const location = address?.city || address?.location || null
            
            // Extract social links
            const socialLinks = (profile?.socialLinks as any) || {}
            
            return (
              <Link
                key={member.id}
                href={`/portal/${houseSlug}/directory/${member.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition group"
              >
                {/* Header with avatar and role */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    {user.image ? (
                      <img 
                        src={user.image} 
                        alt={user.name || ''} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'M'}
                      </div>
                    )}
                    <span className={`absolute -bottom-1 -right-1 px-2 py-0.5 text-xs font-medium rounded-full ${roleInfo.color}`}>
                      <RoleIcon className="inline h-3 w-3 mr-0.5" />
                      {roleInfo.label}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition truncate">
                      {user.name || 'Unknown Member'}
                    </h3>
                    {!privacy?.hideEmail && user.email && (
                      <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Professional Info */}
                {profile && (
                  <div className="space-y-2 text-sm">
                    {profile.jobTitle && (
                      <p className="text-gray-700 flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{profile.jobTitle}</span>
                      </p>
                    )}
                    {profile.company && !privacy?.hideCompany && (
                      <p className="text-gray-700 flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{profile.company}</span>
                      </p>
                    )}
                    {location && (
                      <p className="text-gray-500 flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{location}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Skills */}
                {profile?.skills && (profile.skills as string[]).length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Code className="h-3 w-3" />
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(profile.skills as string[]).slice(0, 3).map((skill: string, i: number) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {(profile.skills as string[]).length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-gray-500">
                          +{(profile.skills as string[]).length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {profile?.interests && (profile.interests as string[]).length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      Interests
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(profile.interests as string[]).slice(0, 3).map((interest: string, i: number) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 text-xs bg-purple-50 text-purple-700 rounded-full"
                        >
                          {interest}
                        </span>
                      ))}
                      {(profile.interests as string[]).length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-gray-500">
                          +{(profile.interests as string[]).length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {socialLinks && Object.values(socialLinks).some((v: any) => v) && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-3">
                    {socialLinks.website && <Globe className="h-4 w-4 text-gray-400 hover:text-gray-600" />}
                    {socialLinks.twitter && (
                      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/>
                      </svg>
                    )}
                    {socialLinks.linkedin && (
                      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </span>
                  <span className="text-sm font-medium text-purple-600 group-hover:text-purple-700 flex items-center">
                    View Profile
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/portal/${houseSlug}/directory?page=${page - 1}${role ? `&role=${role}` : ''}${search ? `&search=${search}` : ''}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/portal/${houseSlug}/directory?page=${page + 1}${role ? `&role=${role}` : ''}${search ? `&search=${search}` : ''}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}