// app/org/[orgSlug]/houses/[houseSlug]/audit-logs/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { 
  Shield, 
  Search,
  Filter,
  Calendar,
  User,
  Home,
  Ticket,
  CreditCard,
  FileText,
  Users,
  Settings,
  ChevronDown,
  ArrowUpDown,
  Eye,
} from 'lucide-react'
import AuditLogFilters from '@/components/audit/AuditLogFilters'

interface AuditLogsPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
  searchParams: {
    page?: string
    action?: string
    entityType?: string
    userId?: string
    startDate?: string
    endDate?: string
  }
}

export default async function AuditLogsPage({ params, searchParams }: AuditLogsPageProps) {
  const page = parseInt(searchParams.page || '1')
  const limit = 25
  const action = searchParams.action
  const entityType = searchParams.entityType
  const userId = searchParams.userId
  const startDate = searchParams.startDate
  const endDate = searchParams.endDate

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

  // Build where clause
  const where: any = {
    houseId: house.id
  }

  if (action) where.action = action
  if (entityType) where.entityType = entityType
  if (userId) where.userId = userId
  
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate)
  }

  // Get logs with pagination
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        house: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    }),
    prisma.auditLog.count({ where })
  ])

  // Get unique actions for filter dropdown
  const uniqueActions = await prisma.auditLog.findMany({
    where: { houseId: house.id },
    select: { action: true },
    distinct: ['action'],
    orderBy: { action: 'asc' }
  })

  // Get unique entity types for filter dropdown
  const uniqueEntityTypes = await prisma.auditLog.findMany({
    where: { houseId: house.id },
    select: { entityType: true },
    distinct: ['entityType'],
    orderBy: { entityType: 'asc' }
  })

  // Get users who performed actions for filter dropdown
  const uniqueUsers = await prisma.auditLog.findMany({
    where: { 
      houseId: house.id,
      userId: { not: null }
    },
    select: {
      userId: true,
      user: {
        select: {
          name: true,
          email: true,
        }
      }
    },
    distinct: ['userId'],
    orderBy: { user: { name: 'asc' } }
  })

  const totalPages = Math.ceil(total / limit)

  // Action labels and icons
  const actionConfig: Record<string, { label: string; color: string; icon: any }> = {
    // Events
    EVENT_CREATED: { label: 'Event Created', color: 'bg-green-100 text-green-800', icon: Calendar },
    EVENT_UPDATED: { label: 'Event Updated', color: 'bg-blue-100 text-blue-800', icon: Calendar },
    EVENT_DELETED: { label: 'Event Deleted', color: 'bg-red-100 text-red-800', icon: Calendar },
    EVENT_PUBLISHED: { label: 'Event Published', color: 'bg-green-100 text-green-800', icon: Calendar },
    EVENT_CANCELLED: { label: 'Event Cancelled', color: 'bg-orange-100 text-orange-800', icon: Calendar },
    
    // Tickets
    TICKET_CREATED: { label: 'Ticket Created', color: 'bg-green-100 text-green-800', icon: Ticket },
    TICKET_UPDATED: { label: 'Ticket Updated', color: 'bg-blue-100 text-blue-800', icon: Ticket },
    TICKET_DELETED: { label: 'Ticket Deleted', color: 'bg-red-100 text-red-800', icon: Ticket },
    TICKET_PUBLISHED: { label: 'Ticket Published', color: 'bg-green-100 text-green-800', icon: Ticket },
    
    // Members
    MEMBER_INVITED: { label: 'Member Invited', color: 'bg-blue-100 text-blue-800', icon: Users },
    MEMBER_JOINED: { label: 'Member Joined', color: 'bg-green-100 text-green-800', icon: Users },
    MEMBER_REMOVED: { label: 'Member Removed', color: 'bg-red-100 text-red-800', icon: Users },
    MEMBER_UPDATED: { label: 'Member Updated', color: 'bg-blue-100 text-blue-800', icon: Users },
    
    // Membership Plans
    MEMBERSHIP_PLAN_CREATED: { label: 'Plan Created', color: 'bg-green-100 text-green-800', icon: FileText },
    MEMBERSHIP_PLAN_UPDATED: { label: 'Plan Updated', color: 'bg-blue-100 text-blue-800', icon: FileText },
    MEMBERSHIP_PLAN_DELETED: { label: 'Plan Deleted', color: 'bg-red-100 text-red-800', icon: FileText },
    
    // Applications
    APPLICATION_SUBMITTED: { label: 'Application Submitted', color: 'bg-blue-100 text-blue-800', icon: FileText },
    APPLICATION_APPROVED: { label: 'Application Approved', color: 'bg-green-100 text-green-800', icon: FileText },
    APPLICATION_REJECTED: { label: 'Application Rejected', color: 'bg-red-100 text-red-800', icon: FileText },
    APPLICATION_REVIEWED: { label: 'Application Reviewed', color: 'bg-purple-100 text-purple-800', icon: FileText },
    
    // Payments
    PAYMENT_RECEIVED: { label: 'Payment Received', color: 'bg-green-100 text-green-800', icon: CreditCard },
    PAYMENT_REFUNDED: { label: 'Payment Refunded', color: 'bg-orange-100 text-orange-800', icon: CreditCard },
    
    // Settings
    HOUSE_SETTINGS_UPDATED: { label: 'Settings Updated', color: 'bg-blue-100 text-blue-800', icon: Settings },
    HOUSE_CREATED: { label: 'House Created', color: 'bg-green-100 text-green-800', icon: Home },
    HOUSE_UPDATED: { label: 'House Updated', color: 'bg-blue-100 text-blue-800', icon: Home },
  }

  const getActionConfig = (action: string) => {
    return actionConfig[action] || { 
      label: action.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
      color: 'bg-gray-100 text-gray-800',
      icon: Shield 
    }
  }

  const entityTypeLabels: Record<string, string> = {
    EVENT: 'Event',
    TICKET: 'Ticket',
    HOUSE: 'House',
    MEMBERSHIP_PLAN: 'Membership Plan',
    MEMBERSHIP_APPLICATION: 'Application',
    HOUSE_MEMBERSHIP: 'Member',
    PAYMENT: 'Payment',
    COMMUNICATION: 'Communication',
    FORM: 'Form',
    SETTINGS: 'Settings',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {house.name} • Track all activities and changes
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-sm text-gray-500">Total Events</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {logs.filter(l => l.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
          </p>
          <p className="text-sm text-gray-500">Last 24 Hours</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{uniqueUsers.length}</p>
          <p className="text-sm text-gray-500">Active Users</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{uniqueActions.length}</p>
          <p className="text-sm text-gray-500">Action Types</p>
        </div>
      </div>

      {/* Filters */}
      <AuditLogFilters 
        orgSlug={params.orgSlug}
        houseSlug={params.houseSlug}
        actions={uniqueActions.map(a => a.action)}
        entityTypes={uniqueEntityTypes.map(e => e.entityType)}
        users={uniqueUsers.map(u => ({ 
          id: u.userId!, 
          name: u.user?.name || u.user?.email || 'Unknown' 
        }))}
        currentFilters={searchParams}
      />

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {logs.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
            <p className="text-gray-500">
              {Object.keys(searchParams).length > 1 
                ? 'Try adjusting your filters' 
                : 'Activities will appear here as they happen'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => {
                    const config = getActionConfig(log.action)
                    const ActionIcon = config.icon
                    
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`p-1.5 rounded-lg ${config.color}`}>
                              <ActionIcon className="h-4 w-4" />
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {config.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm text-gray-900">
                              {entityTypeLabels[log.entityType] || log.entityType}
                            </p>
                            {log.entityId && (
                              <p className="text-xs text-gray-500 font-mono">
                                {log.entityId.substring(0, 8)}...
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {log.user ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                                {log.user.image ? (
                                  <img src={log.user.image} alt="" className="w-7 h-7 rounded-full" />
                                ) : (
                                  <User className="h-4 w-4 text-gray-500" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm text-gray-900">
                                  {log.user.name || log.user.email}
                                </p>
                                {log.userIp && (
                                  <p className="text-xs text-gray-500">{log.userIp}</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-500" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">System</p>
                                {log.userEmail && (
                                  <p className="text-xs text-gray-500">{log.userEmail}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {log.metadata && (
                            <div className="max-w-xs">
                              <pre className="text-xs text-gray-500 truncate">
                                {JSON.stringify(log.metadata, null, 0).substring(0, 50)}...
                              </pre>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm text-gray-900">
                              {new Date(log.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/org/${params.orgSlug}/houses/${params.houseSlug}/audit-logs/${log.id}`}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} logs
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={{
                        pathname: `/org/${params.orgSlug}/houses/${params.houseSlug}/audit-logs`,
                        query: { ...searchParams, page: page - 1 }
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={{
                        pathname: `/org/${params.orgSlug}/houses/${params.houseSlug}/audit-logs`,
                        query: { ...searchParams, page: page + 1 }
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}