// app/org/[orgSlug]/houses/[houseSlug]/members/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { 
  Users, 
  Search, 
  Filter,
  MoreVertical,
  Mail,
  UserPlus,
  Download,
  Upload,
} from 'lucide-react'

interface MembersPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
  searchParams: {
    page?: string
    search?: string
    role?: string
    status?: string
  }
}

export default async function MembersPage({ params, searchParams }: MembersPageProps) {
  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const search = searchParams.search || ''
  const role = searchParams.role
  const status = searchParams.status || 'ACTIVE'

  const house = await prisma.house.findFirst({
    where: {
      slug: params.houseSlug,
      organization: { slug: params.orgSlug }
    },
    include: {
      organization: true,
    }
  })

  if (!house) {
    return <div>House not found</div>
  }

  const where: any = {
    houseId: house.id,
    status: status as any,
  }

  if (role) where.role = role
  if (search) {
    where.OR = [
      { membership: { user: { name: { contains: search, mode: 'insensitive' } } } },
      { membership: { user: { email: { contains: search, mode: 'insensitive' } } } },
    ]
  }

  const [members, total] = await Promise.all([
    prisma.houseMembership.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { joinedAt: 'desc' },
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
            jobTitle: true,
            company: true,
          }
        }
      }
    }),
    prisma.houseMembership.count({ where })
  ])

  const totalPages = Math.ceil(total / limit)

  const roleCounts = await prisma.houseMembership.groupBy({
    by: ['role'],
    where: { houseId: house.id },
    _count: true,
  })

  const statusCounts = await prisma.houseMembership.groupBy({
    by: ['status'],
    where: { houseId: house.id },
    _count: true,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500 mt-1">
            {house.name} • {total} total members
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/members/import`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            Import
          </Link>
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/members/export`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export
          </Link>
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/members/invite`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Link>
        </div>
      </div>

      {/* Filters */}
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
                placeholder="Search members by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>

          {/* Role Filter */}
          <div className="flex gap-2">
            <Link
              href={`?${new URLSearchParams({ ...searchParams, role: '' })}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                !role ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Roles
            </Link>
            {roleCounts.map((r) => (
              <Link
                key={r.role}
                href={`?${new URLSearchParams({ ...searchParams, role: r.role })}`}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  role === r.role ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {r.role.replace('HOUSE_', '')} ({r._count})
              </Link>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {statusCounts.map((s) => (
              <Link
                key={s.status}
                href={`?${new URLSearchParams({ ...searchParams, status: s.status })}`}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  status === s.status ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s.status} ({s._count})
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      {member.membership.user.image ? (
                        <img src={member.membership.user.image} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <span className="text-gray-600 font-medium">
                          {member.membership.user.name?.[0] || member.membership.user.email[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.membership.user.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">{member.membership.user.email}</p>
                      {member.memberProfile?.jobTitle && (
                        <p className="text-xs text-gray-400">{member.memberProfile.jobTitle}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    member.role === 'HOUSE_MANAGER' ? 'bg-blue-100 text-blue-800' :
                    member.role === 'HOUSE_ADMIN' ? 'bg-purple-100 text-purple-800' :
                    member.role === 'HOUSE_STAFF' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {member.role.replace('HOUSE_', '')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    member.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    member.status === 'PAUSED' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`mailto:${member.membership.user.email}`}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <Mail className="h-4 w-4" />
                    </Link>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {members.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No members found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} members
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}