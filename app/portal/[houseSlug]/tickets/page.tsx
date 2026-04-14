// app/portal/[houseSlug]/tickets/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Ticket,
  Calendar,
  MapPin,
  QrCode,
  ChevronRight,
} from 'lucide-react'

interface TicketsPageProps {
  params: {
    houseSlug: string
  }
}

export default async function PortalTicketsPage({ params }: TicketsPageProps) {
  const { houseSlug } = await Promise.resolve(params)

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

  // Get user's ticket purchases
  const purchases = await prisma.ticketPurchase.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { houseMembershipId: memberAccess?.id }
      ]
    },
    include: {
      ticket: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              location: true,
              imageUrl: true,
            }
          }
        }
      },
      validations: {
        orderBy: { validatedAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your ticket purchases for {targetHouse.name}
        </p>
      </div>

      {/* Tickets List */}
      {purchases.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets yet</h3>
          <p className="text-gray-500 mb-4">
            Browse events and purchase tickets to see them here
          </p>
          <Link
            href={`/portal/${houseSlug}/events`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: primaryColor }}
          >
            Browse Events
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => {
            const ticket = purchase.ticket
            const event = ticket.event
            const isFullyUsed = purchase.fullyUsed
            
            return (
              <div
                key={purchase.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{ticket.name}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          purchase.paymentStatus === 'SUCCEEDED' 
                            ? 'bg-green-100 text-green-800'
                            : purchase.paymentStatus === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {purchase.paymentStatus}
                        </span>
                        {isFullyUsed && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            Fully Redeemed
                          </span>
                        )}
                      </div>
                      
                      {event && (
                        <Link
                          href={`/portal/${houseSlug}/events/${event.id}`}
                          className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 mb-3"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          {event.title}
                        </Link>
                      )}

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Quantity</p>
                          <p className="font-medium text-gray-900">{purchase.quantity}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total</p>
                          <p className="font-medium text-gray-900">
                            {purchase.currency} {purchase.totalAmount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Redeemed</p>
                          <p className="font-medium text-gray-900">
                            {purchase.usedCount} / {purchase.quantity}
                          </p>
                        </div>
                      </div>

                      {event && (
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(event.startDate).toLocaleDateString()}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/portal/${houseSlug}/tickets/${purchase.id}`}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        title="View Details"
                      >
                        <QrCode className="h-5 w-5" />
                      </Link>
                      <a
                        href={`/api/portal/${houseSlug}/tickets/${purchase.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        title="Download Ticket"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}