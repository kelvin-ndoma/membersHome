// app/portal/[houseSlug]/directory/[memberId]/page.tsx
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Building2,
  MapPin,
  Briefcase,
  Code,
  Heart,
  Globe,
  Calendar,
  Shield,
  Crown,
  User,
  MessageSquare,
} from 'lucide-react'

interface MemberDetailPageProps {
  params: {
    houseSlug: string
    memberId: string
  }
}

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { houseSlug, memberId } = await Promise.resolve(params)

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
        select: { primaryColor: true }
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
  let currentMemberAccess = null
  let primaryColor = '#8B5CF6'

  for (const membership of userMemberships) {
    const hm = membership.houseMemberships[0]
    if (hm) {
      targetHouse = hm.house
      currentMemberAccess = hm
      primaryColor = membership.organization?.primaryColor || '#8B5CF6'
      break
    }
  }

  if (!targetHouse || !currentMemberAccess) {
    redirect('/portal/my-houses')
  }

  // Get the member being viewed
  const member = await prisma.houseMembership.findFirst({
    where: {
      id: memberId,
      houseId: targetHouse.id,
      status: 'ACTIVE'
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
              phone: true,
            }
          }
        }
      },
      memberProfile: true
    }
  })

  if (!member) {
    notFound()
  }

  const profile = member.memberProfile
  const user = member.membership.user
  const privacy = (profile?.privacySettings as any) || {}
  
  // Extract location from address JSON
  const address = (profile?.address as any) || {}
  const location = address.city || address.location || address.street || null
  
  // Extract social links
  const socialLinks = (profile?.socialLinks as any) || {}

  // Role config
  const roleConfig: Record<string, { label: string; icon: any; color: string }> = {
    HOUSE_MANAGER: { label: 'House Manager', icon: Crown, color: 'bg-purple-100 text-purple-800' },
    HOUSE_ADMIN: { label: 'House Admin', icon: Shield, color: 'bg-blue-100 text-blue-800' },
    HOUSE_STAFF: { label: 'House Staff', icon: Shield, color: 'bg-green-100 text-green-800' },
    HOUSE_MEMBER: { label: 'Member', icon: User, color: 'bg-gray-100 text-gray-800' },
  }

  const roleInfo = roleConfig[member.role] || { label: member.role, icon: User, color: 'bg-gray-100 text-gray-800' }
  const RoleIcon = roleInfo.icon

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href={`/portal/${houseSlug}/directory`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Directory
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div 
          className="h-32 bg-gradient-to-r"
          style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)` }}
        />
        
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10">
            <div className="relative">
              {user.image ? (
                <img 
                  src={user.image} 
                  alt={user.name || ''} 
                  className="w-24 h-24 rounded-xl border-4 border-white shadow-md object-cover"
                />
              ) : (
                <div 
                  className="w-24 h-24 rounded-xl border-4 border-white shadow-md flex items-center justify-center text-white text-3xl font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'M'}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{user.name || 'Unknown Member'}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${roleInfo.color}`}>
                  <RoleIcon className="h-3 w-3" />
                  {roleInfo.label}
                </span>
                <span className="text-sm text-gray-500">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Message Button */}
            <Link
              href={`/portal/${houseSlug}/messages/new?to=${member.id}`}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <MessageSquare className="h-4 w-4" />
              Message
            </Link>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              {!privacy?.hideEmail && user.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <a href={`mailto:${user.email}`} className="text-purple-600 hover:text-purple-700">
                    {user.email}
                  </a>
                </div>
              )}
              {!privacy?.hidePhone && user.phone && (
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-700">{user.phone}</span>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Professional Information */}
          {(profile?.jobTitle || profile?.company || profile?.industry) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Professional Information</h2>
              <div className="space-y-3">
                {profile.jobTitle && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">{profile.jobTitle}</span>
                  </div>
                )}
                {profile.company && !privacy?.hideCompany && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">{profile.company}</span>
                  </div>
                )}
                {profile.industry && (
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-gray-700">{profile.industry}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skills */}
          {profile?.skills && (profile.skills as string[]).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Code className="h-5 w-5" />
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {(profile.skills as string[]).map((skill: string, i: number) => (
                  <span 
                    key={i}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {profile?.interests && (profile.interests as string[]).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {(profile.interests as string[]).map((interest: string, i: number) => (
                  <span 
                    key={i}
                    className="px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-full"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Social Links */}
          {socialLinks && Object.values(socialLinks).some((v: any) => v) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Connect</h2>
              <div className="space-y-2">
                {socialLinks.website && (
                  <a 
                    href={socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-purple-600"
                  >
                    <Globe className="h-5 w-5" />
                    <span>Website</span>
                  </a>
                )}
                {socialLinks.twitter && (
                  <a 
                    href={`https://x.com/${socialLinks.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-purple-600"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/>
                    </svg>
                    <span>@{socialLinks.twitter}</span>
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a 
                    href={`https://linkedin.com/in/${socialLinks.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-purple-600"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span>{socialLinks.linkedin}</span>
                  </a>
                )}
                {socialLinks.github && (
                  <a 
                    href={`https://github.com/${socialLinks.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-purple-600"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                    <span>{socialLinks.github}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Member Since */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Member Since</h2>
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span>{new Date(member.joinedAt).toLocaleDateString('en-US', { 
                year: 'numeric', month: 'long', day: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}