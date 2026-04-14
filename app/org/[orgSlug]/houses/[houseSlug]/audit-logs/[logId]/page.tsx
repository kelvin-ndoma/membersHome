// app/org/[orgSlug]/houses/[houseSlug]/audit-logs/[logId]/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  ArrowLeft,
  Shield,
  User,
  Calendar,
  Clock,
  Home,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle,
  Globe,
  Monitor,
} from 'lucide-react'

interface AuditLogDetailPageProps {
  params: {
    orgSlug: string
    houseSlug: string
    logId: string
  }
}

export default async function AuditLogDetailPage({ params }: AuditLogDetailPageProps) {
  const log = await prisma.auditLog.findFirst({
    where: {
      id: params.logId,
      house: {
        slug: params.houseSlug,
        organization: { slug: params.orgSlug }
      }
    },
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
      },
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      }
    }
  })

  if (!log) {
    notFound()
  }

  // Action labels and icons
  const actionConfig: Record<string, { label: string; color: string; icon: any }> = {
    // Events
    EVENT_CREATED: { label: 'Event Created', color: 'bg-green-100 text-green-800', icon: Calendar },
    EVENT_UPDATED: { label: 'Event Updated', color: 'bg-blue-100 text-blue-800', icon: Calendar },
    EVENT_DELETED: { label: 'Event Deleted', color: 'bg-red-100 text-red-800', icon: Calendar },
    EVENT_PUBLISHED: { label: 'Event Published', color: 'bg-green-100 text-green-800', icon: Calendar },
    EVENT_CANCELLED: { label: 'Event Cancelled', color: 'bg-orange-100 text-orange-800', icon: Calendar },
    
    // Tickets
    TICKET_CREATED: { label: 'Ticket Created', color: 'bg-green-100 text-green-800', icon: Tag },
    TICKET_UPDATED: { label: 'Ticket Updated', color: 'bg-blue-100 text-blue-800', icon: Tag },
    TICKET_DELETED: { label: 'Ticket Deleted', color: 'bg-red-100 text-red-800', icon: Tag },
    TICKET_PUBLISHED: { label: 'Ticket Published', color: 'bg-green-100 text-green-800', icon: Tag },
    
    // Members
    MEMBER_INVITED: { label: 'Member Invited', color: 'bg-blue-100 text-blue-800', icon: User },
    MEMBER_JOINED: { label: 'Member Joined', color: 'bg-green-100 text-green-800', icon: User },
    MEMBER_REMOVED: { label: 'Member Removed', color: 'bg-red-100 text-red-800', icon: User },
    MEMBER_UPDATED: { label: 'Member Updated', color: 'bg-blue-100 text-blue-800', icon: User },
    MEMBER_INVITATION_ACCEPTED: { label: 'Invitation Accepted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    
    // Membership Plans
    MEMBERSHIP_PLAN_CREATED: { label: 'Plan Created', color: 'bg-green-100 text-green-800', icon: FileText },
    MEMBERSHIP_PLAN_UPDATED: { label: 'Plan Updated', color: 'bg-blue-100 text-blue-800', icon: FileText },
    MEMBERSHIP_PLAN_DELETED: { label: 'Plan Deleted', color: 'bg-red-100 text-red-800', icon: FileText },
    
    // Applications
    APPLICATION_SUBMITTED: { label: 'Application Submitted', color: 'bg-blue-100 text-blue-800', icon: FileText },
    APPLICATION_APPROVED: { label: 'Application Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    APPLICATION_REJECTED: { label: 'Application Rejected', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    APPLICATION_REVIEWED: { label: 'Application Reviewed', color: 'bg-purple-100 text-purple-800', icon: FileText },
    APPLICATION_MOVED_TO_REVIEWING: { label: 'Moved to Reviewing', color: 'bg-blue-100 text-blue-800', icon: FileText },
    
    // Payments
    PAYMENT_RECEIVED: { label: 'Payment Received', color: 'bg-green-100 text-green-800', icon: Tag },
    PAYMENT_REFUNDED: { label: 'Payment Refunded', color: 'bg-orange-100 text-orange-800', icon: Tag },
    
    // Settings
    HOUSE_SETTINGS_UPDATED: { label: 'Settings Updated', color: 'bg-blue-100 text-blue-800', icon: Home },
    HOUSE_CREATED: { label: 'House Created', color: 'bg-green-100 text-green-800', icon: Home },
    HOUSE_UPDATED: { label: 'House Updated', color: 'bg-blue-100 text-blue-800', icon: Home },
    
    // Communications
    COMMUNICATION_CREATED: { label: 'Communication Created', color: 'bg-green-100 text-green-800', icon: FileText },
    COMMUNICATION_SENT: { label: 'Communication Sent', color: 'bg-blue-100 text-blue-800', icon: FileText },
    COMMUNICATION_DELETED: { label: 'Communication Deleted', color: 'bg-red-100 text-red-800', icon: FileText },
  }

  const config = actionConfig[log.action] || { 
    label: log.action.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
    color: 'bg-gray-100 text-gray-800',
    icon: Shield 
  }
  const ActionIcon = config.icon

  const entityTypeLabels: Record<string, string> = {
    EVENT: 'Event',
    TICKET: 'Ticket',
    HOUSE: 'House',
    MEMBERSHIP_PLAN: 'Membership Plan',
    MEMBERSHIP_APPLICATION: 'Application',
    HOUSE_MEMBERSHIP: 'Member',
    PAYMENT: 'Payment',
    COMMUNICATION: 'Communication',
    CUSTOM_FORM: 'Form',
    FORM_SUBMISSION: 'Form Submission',
    SETTINGS: 'Settings',
    USER: 'User',
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Navigation */}
      <Link 
        href={`/org/${params.orgSlug}/houses/${params.houseSlug}/audit-logs`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Audit Logs
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${config.color}`}>
            <ActionIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{config.label}</h1>
            <p className="text-sm text-gray-500 mt-1">Audit Log Entry</p>
          </div>
        </div>
      </div>

      {/* Log Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Event Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Action</p>
              <p className="font-medium text-gray-900">{config.label}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Entity Type</p>
              <p className="font-medium text-gray-900">
                {entityTypeLabels[log.entityType] || log.entityType}
              </p>
            </div>
            
            {log.entityId && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Entity ID</p>
                <p className="font-mono text-sm text-gray-900">{log.entityId}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Date & Time</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {new Date(log.createdAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {new Date(log.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">House</p>
              {log.house ? (
                <Link 
                  href={`/org/${params.orgSlug}/houses/${log.house.slug}/dashboard`}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Home className="h-4 w-4" />
                  {log.house.name}
                </Link>
              ) : (
                <p className="text-gray-500">—</p>
              )}
            </div>
            
            {log.organization && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Organization</p>
                <p className="text-gray-900">{log.organization.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Performed By</h2>
        
        {log.user ? (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              {log.user.image ? (
                <img src={log.user.image} alt="" className="w-12 h-12 rounded-full" />
              ) : (
                <User className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{log.user.name || 'Unknown'}</p>
              <p className="text-sm text-gray-500">{log.user.email}</p>
              {log.userEmail && log.userEmail !== log.user.email && (
                <p className="text-xs text-gray-400 mt-1">Logged as: {log.userEmail}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">System</p>
              {log.userEmail && (
                <p className="text-sm text-gray-500">{log.userEmail}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Network Information */}
        {(log.userIp || log.userAgent) && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Network Information</h3>
            <div className="space-y-2">
              {log.userIp && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">IP Address: {log.userIp}</span>
                </div>
              )}
              {log.userAgent && (
                <div className="flex items-start gap-2">
                  <Monitor className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600 break-all">{log.userAgent}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Changes */}
      {(log.oldValues || log.newValues) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Changes</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {log.oldValues && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Before</p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all">
                    {JSON.stringify(log.oldValues, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {log.newValues && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">After</p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all">
                    {JSON.stringify(log.newValues, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      {log.metadata && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Additional Metadata</h2>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Raw JSON (for debugging - can be removed) */}
      <details className="bg-white rounded-xl border border-gray-200">
        <summary className="px-6 py-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
          Raw Log Entry
        </summary>
        <div className="px-6 pb-6">
          <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all bg-gray-50 p-4 rounded-lg">
            {JSON.stringify({
              id: log.id,
              action: log.action,
              entityType: log.entityType,
              entityId: log.entityId,
              userId: log.userId,
              userEmail: log.userEmail,
              userIp: log.userIp,
              userAgent: log.userAgent,
              organizationId: log.organizationId,
              houseId: log.houseId,
              createdAt: log.createdAt,
            }, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  )
}