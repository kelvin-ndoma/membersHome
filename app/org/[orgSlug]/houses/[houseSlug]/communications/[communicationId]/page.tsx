// app/org/[orgSlug]/houses/[houseSlug]/communications/[communicationId]/page.tsx
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  Edit,
  Copy,
  BarChart3,
  Mail,
  Megaphone,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Eye,
  MousePointer,
} from 'lucide-react'

interface CommunicationDetailPageProps {
  params: {
    orgSlug: string
    houseSlug: string
    communicationId: string
  }
}

export default async function CommunicationDetailPage({ params }: CommunicationDetailPageProps) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const house = await prisma.house.findFirst({
    where: {
      slug: params.houseSlug,
      organization: { slug: params.orgSlug }
    }
  })

  if (!house) {
    return <div>House not found</div>
  }

  const communication = await prisma.communication.findFirst({
    where: {
      id: params.communicationId,
      OR: [
        { houseId: house.id },
        { organizationId: house.organizationId, houseId: null }
      ]
    },
    include: {
      creator: {
        select: { id: true, name: true, email: true }
      }
    }
  })

  if (!communication) {
    notFound()
  }

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

  const statusInfo = statusConfig[communication.status] || { label: communication.status, color: 'bg-gray-100', icon: Clock }
  const typeInfo = typeConfig[communication.type] || { label: communication.type, icon: Mail }
  const StatusIcon = statusInfo.icon
  const TypeIcon = typeInfo.icon

  const openRate = communication.sentCount > 0 
    ? ((communication.openedCount / communication.sentCount) * 100).toFixed(1) 
    : '0'
  
  const clickRate = communication.openedCount > 0 
    ? ((communication.clickedCount / communication.openedCount) * 100).toFixed(1) 
    : '0'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href={`/org/${params.orgSlug}/houses/${params.houseSlug}/communications`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Communications
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{communication.subject}</h1>
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${statusInfo.color}`}>
                  <StatusIcon className="h-4 w-4" />
                  {statusInfo.label}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                  <TypeIcon className="h-4 w-4" />
                  {typeInfo.label}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Created by {communication.creator?.name || 'Unknown'} on {new Date(communication.createdAt).toLocaleString()}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {communication.status === 'DRAFT' && (
                <>
                  <Link
                    href={`/org/${params.orgSlug}/houses/${params.houseSlug}/communications/${communication.id}/edit`}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit className="h-5 w-5" />
                  </Link>
                  <button className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition">
                    <Send className="h-5 w-5" />
                  </button>
                </>
              )}
              {communication.status === 'SENT' && (
                <Link
                  href={`/org/${params.orgSlug}/houses/${params.houseSlug}/communications/${communication.id}/analytics`}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  title="View Analytics"
                >
                  <BarChart3 className="h-5 w-5" />
                </Link>
              )}
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                <Copy className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Recipient Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Users className="h-4 w-4 text-gray-400" />
              <span>
                <strong>Recipients:</strong>{' '}
                {communication.recipientType === 'ALL_MEMBERS' && 'All Members'}
                {communication.recipientType === 'HOUSE_MEMBERS' && 'House Members'}
                {communication.recipientType === 'EVENT_ATTENDEES' && 'Event Attendees'}
                {communication.recipientType === 'TICKET_BUYERS' && 'Ticket Buyers'}
                {communication.recipientType === 'CUSTOM_SEGMENT' && 'Custom Segment'}
              </span>
            </div>
            {communication.scheduledFor && (
              <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>
                  <strong>Scheduled for:</strong> {new Date(communication.scheduledFor).toLocaleString()}
                </span>
              </div>
            )}
            {communication.sentAt && (
              <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                <Send className="h-4 w-4 text-gray-400" />
                <span>
                  <strong>Sent at:</strong> {new Date(communication.sentAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          {communication.status === 'SENT' && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Send className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">{communication.sentCount}</p>
                <p className="text-xs text-gray-600">Sent</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <Eye className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">{communication.openedCount}</p>
                <p className="text-xs text-gray-600">Opened ({openRate}%)</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <MousePointer className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">{communication.clickedCount}</p>
                <p className="text-xs text-gray-600">Clicked ({clickRate}%)</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Users className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">
                  {communication.sentCount - communication.openedCount}
                </p>
                <p className="text-xs text-gray-600">Unopened</p>
              </div>
            </div>
          )}

          {/* Message Body */}
          <div className="border-t border-gray-100 pt-6">
            <h2 className="font-semibold text-gray-900 mb-4">Message Content</h2>
            <div className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-6">
              <div dangerouslySetInnerHTML={{ __html: communication.body }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}