// app/org/[orgSlug]/houses/[houseSlug]/communications/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Send,
  Plus,
  Search,
  Filter,
  Mail,
  Megaphone,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Copy,
  BarChart3,
  Users,
  Calendar,
} from 'lucide-react'

interface CommunicationsPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
  searchParams: {
    page?: string
    status?: string
    type?: string
    search?: string
  }
}

export default async function CommunicationsPage({ params, searchParams }: CommunicationsPageProps) {
  const page = parseInt(searchParams.page || '1')
  const limit = 10
  const status = searchParams.status
  const type = searchParams.type
  const search = searchParams.search || ''

  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  // Find the house
  const house = await prisma.house.findFirst({
    where: {
      slug: params.houseSlug,
      organization: { slug: params.orgSlug }
    },
    include: {
      organization: true,
      members: {
        where: {
          membership: { userId: session.user.id },
          role: { in: ['HOUSE_MANAGER', 'HOUSE_ADMIN', 'HOUSE_STAFF'] }
        }
      }
    }
  })

  if (!house) {
    return <div>House not found</div>
  }

  // Check if user is org admin
  const isOrgAdmin = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organizationId: house.organizationId,
      role: { in: ['ORG_OWNER', 'ORG_ADMIN'] }
    }
  })

  if (house.members.length === 0 && !isOrgAdmin) {
    redirect(`/org/${params.orgSlug}/dashboard`)
  }

  // Build where clause
  const where: any = {
    OR: [
      { houseId: house.id },
      { organizationId: house.organizationId, houseId: null }
    ]
  }

  if (status) where.status = status
  if (type) where.type = type
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { body: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [communications, total, memberCount] = await Promise.all([
    prisma.communication.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    }),
    prisma.communication.count({ where }),
    prisma.houseMembership.count({
      where: { houseId: house.id, status: 'ACTIVE' }
    })
  ])

  const totalPages = Math.ceil(total / limit)

  const statusCounts = await prisma.communication.groupBy({
    by: ['status'],
    where: {
      OR: [
        { houseId: house.id },
        { organizationId: house.organizationId, houseId: null }
      ]
    },
    _count: true
  })

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
    SCHEDULED: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800', icon: Calendar },
    SENDING: { label: 'Sending', color: 'bg-yellow-100 text-yellow-800', icon: Send },
    SENT: { label: 'Sent', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: XCircle },
  }

  const typeConfig: Record<string, { label: string; icon: any }> = {
    EMAIL: { label: 'Email', icon: Mail },
    ANNOUNCEMENT: { label: 'Announcement', icon: Megaphone },
    PUSH_NOTIFICATION: { label: 'Push Notification', icon: Send },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Send announcements and emails to your members • {memberCount} active members
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/communications/templates`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Copy className="h-4 w-4" />
            Templates
          </Link>
          <Link
            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/communications/create`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            New Communication
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
                placeholder="Search communications..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </form>

          {/* Status Filter */}
          <div className="flex gap-2">
            <Link
              href={`/org/${params.orgSlug}/houses/${params.houseSlug}/communications`}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                !status ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({total})
            </Link>
            {statusCounts.map((s) => {
              const config = statusConfig[s.status] || { label: s.status, color: 'bg-gray-100' }
              return (
                <Link
                  key={s.status}
                  href={`?status=${s.status}`}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                    status === s.status ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {config.label} ({s._count})
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Communications List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {communications.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No communications yet</h3>
            <p className="text-gray-500 mb-4">
              Send your first announcement to engage with your members
            </p>
            <Link
              href={`/org/${params.orgSlug}/houses/${params.houseSlug}/communications/create`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Create Communication
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {communications.map((comm) => {
                const typeInfo = typeConfig[comm.type] || { label: comm.type, icon: Mail }
                const statusInfo = statusConfig[comm.status] || { label: comm.status, color: 'bg-gray-100', icon: Clock }
                const StatusIcon = statusInfo.icon
                const TypeIcon = typeInfo.icon
                
                return (
                  <tr key={comm.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{comm.subject}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{comm.body}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                        <TypeIcon className="h-4 w-4" />
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {comm.recipientType === 'ALL_MEMBERS' && 'All Members'}
                      {comm.recipientType === 'HOUSE_MEMBERS' && 'House Members'}
                      {comm.recipientType === 'EVENT_ATTENDEES' && 'Event Attendees'}
                      {comm.recipientType === 'TICKET_BUYERS' && 'Ticket Buyers'}
                      {comm.recipientType === 'CUSTOM_SEGMENT' && 'Custom Segment'}
                    </td>
                    <td className="px-6 py-4">
                      {comm.status === 'SENT' ? (
                        <div className="text-sm">
                          <p className="text-gray-900">{comm.sentCount} sent</p>
                          <p className="text-gray-500">
                            {comm.openedCount} opened • {comm.clickedCount} clicked
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(comm.createdAt).toLocaleDateString()}
                      {comm.scheduledFor && (
                        <p className="text-xs text-gray-400">
                          Scheduled: {new Date(comm.scheduledFor).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/communications/${comm.id}`}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {comm.status === 'DRAFT' && (
                          <Link
                            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/communications/${comm.id}/edit`}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        )}
                        {comm.status === 'SENT' && (
                          <Link
                            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/communications/${comm.id}/analytics`}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            title="Analytics"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} communications
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`?page=${page - 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`?page=${page + 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
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