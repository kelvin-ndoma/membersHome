// app/org/[orgSlug]/houses/[houseSlug]/tickets/[ticketId]/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  Ticket, 
  Calendar, 
  Users, 
  DollarSign,
  CheckCircle,
  ArrowLeft,
  MoreHorizontal,
  User,
  Mail,
  Send,
} from 'lucide-react'
import TicketActions from '@/components/tickets/TicketActions'
import { PublishButton } from '@/components/tickets/PublishButton'

interface TicketDetailPageProps {
  params: {
    orgSlug: string
    houseSlug: string
    ticketId: string
  }
  searchParams: {
    page?: string
    status?: string
  }
}

export default async function TicketDetailPage({ params, searchParams }: TicketDetailPageProps) {
  const page = parseInt(searchParams.page || '1')
  const limit = 10
  const purchaseStatus = searchParams.status

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: params.ticketId,
      OR: [
        { house: { slug: params.houseSlug, organization: { slug: params.orgSlug } } },
        { organization: { slug: params.orgSlug }, houseId: null }
      ]
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          location: true,
          status: true,
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
      },
      purchases: {
        where: purchaseStatus ? { paymentStatus: purchaseStatus as any } : {},
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          houseMembership: {
            include: {
              membership: {
                include: {
                  user: {
                    select: { name: true, email: true }
                  }
                }
              }
            }
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          validations: {
            orderBy: { validatedAt: 'desc' },
          }
        }
      },
      _count: {
        select: {
          purchases: true,
        }
      }
    }
  })

  if (!ticket) {
    notFound()
  }

  const soldPercentage = (ticket.soldQuantity / ticket.totalQuantity) * 100
  const isSoldOut = ticket.soldQuantity >= ticket.totalQuantity
  const isActive = ticket.status === 'ACTIVE'
  const isDraft = ticket.status === 'DRAFT'
  const revenue = ticket.purchases.reduce((sum, p) => sum + p.totalAmount, 0)

  const totalPurchases = await prisma.ticketPurchase.count({
    where: { ticketId: ticket.id }
  })

  const totalPages = Math.ceil(totalPurchases / limit)

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    DRAFT: 'bg-gray-100 text-gray-800',
    SOLD_OUT: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-yellow-100 text-yellow-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
  }

  const paymentStatusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    SUCCEEDED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-orange-100 text-orange-800',
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link 
        href={`/org/${params.orgSlug}/houses/${params.houseSlug}/tickets?eventId=${ticket.event?.id}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tickets
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
              isActive ? 'bg-purple-50' : isDraft ? 'bg-gray-100' : 'bg-gray-100'
            }`}>
              <Ticket className={`h-8 w-8 ${
                isActive ? 'text-purple-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{ticket.name}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[ticket.status as keyof typeof statusColors]}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                {ticket.memberOnly && (
                  <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                    Members Only
                  </span>
                )}
              </div>
              <p className="text-gray-600">{ticket.description || 'No description'}</p>
              
              {/* Event Info */}
              {ticket.event && (
                <Link
                  href={`/org/${params.orgSlug}/houses/${params.houseSlug}/events/${ticket.event.id}`}
                  className="inline-flex items-center gap-2 mt-3 text-sm text-purple-600 hover:text-purple-700"
                >
                  <Calendar className="h-4 w-4" />
                  {ticket.event.title} • {new Date(ticket.event.startDate).toLocaleDateString()}
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Show Publish button for draft tickets */}
            {ticket.status === 'DRAFT' && (
              <PublishButton ticket={ticket} />
            )}
            <TicketActions ticket={ticket} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {ticket.currency} {revenue.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">Total Revenue</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Ticket className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{ticket._count.purchases}</p>
          <p className="text-sm text-gray-500">Total Purchases</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {ticket.soldQuantity} / {ticket.totalQuantity}
          </p>
          <p className="text-sm text-gray-500">Tickets Sold</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {ticket.purchases.filter(p => p.fullyUsed).length}
          </p>
          <p className="text-sm text-gray-500">Fully Redeemed</p>
        </div>
      </div>

      {/* Sales Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Sales Progress</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Tickets Sold</span>
            <span className="font-medium text-gray-900">
              {ticket.soldQuantity} of {ticket.totalQuantity} ({Math.round(soldPercentage)}%)
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                isSoldOut ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(soldPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Ticket Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Ticket Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-medium text-gray-900">{ticket.type.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Price</p>
            <p className="font-medium text-gray-900">{ticket.currency} {ticket.price.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Max Per Purchase</p>
            <p className="font-medium text-gray-900">{ticket.maxPerPurchase || 'Unlimited'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Sales Period</p>
            <p className="font-medium text-gray-900">
              {new Date(ticket.salesStartAt).toLocaleDateString()}
              {ticket.salesEndAt && ` - ${new Date(ticket.salesEndAt).toLocaleDateString()}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Valid From</p>
            <p className="font-medium text-gray-900">
              {ticket.validFrom ? new Date(ticket.validFrom).toLocaleDateString() : 'Same as sales start'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Valid Until</p>
            <p className="font-medium text-gray-900">
              {ticket.validUntil ? new Date(ticket.validUntil).toLocaleDateString() : 'No expiration'}
            </p>
          </div>
          {ticket.requiresApproval && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Approval Required</p>
              <p className="font-medium text-gray-900">Purchases require admin approval</p>
            </div>
          )}
        </div>
      </div>

      {/* Purchases List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Purchases</h3>
        </div>

        {ticket.purchases.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No purchases yet</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Redeemed</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ticket.purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {purchase.customerName || purchase.user?.name || 'Guest'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {purchase.customerEmail || purchase.user?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900">{purchase.quantity}</td>
                    <td className="px-5 py-4 text-sm text-gray-900">
                      {purchase.currency} {purchase.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        paymentStatusColors[purchase.paymentStatus as keyof typeof paymentStatusColors]
                      }`}>
                        {purchase.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900">
                      {purchase.usedCount} / {purchase.quantity}
                      {purchase.fullyUsed && (
                        <CheckCircle className="inline ml-1 h-3 w-3 text-green-600" />
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                          <Mail className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalPurchases)} of {totalPurchases} purchases
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
          </>
        )}
      </div>
    </div>
  )
}