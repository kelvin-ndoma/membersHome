// app/portal/[houseSlug]/tickets/[ticketId]/page.tsx
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  ArrowLeft,
  Ticket,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
} from 'lucide-react'
import QRCode from 'qrcode'

interface TicketDetailPageProps {
  params: {
    houseSlug: string
    ticketId: string
  }
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { houseSlug, ticketId } = await Promise.resolve(params)
  
  console.log('🎫 TicketDetailPage - houseSlug:', houseSlug, 'ticketId:', ticketId)

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

  const purchase = await prisma.ticketPurchase.findFirst({
    where: {
      id: ticketId,
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
              endDate: true,
              location: true,
              imageUrl: true,
            }
          }
        }
      },
      validations: {
        orderBy: { validatedAt: 'desc' }
      }
    }
  })

  if (!purchase) {
    console.log('❌ Purchase not found:', ticketId)
    notFound()
  }

  console.log('✅ Purchase found:', purchase.id)

  const ticket = purchase.ticket
  const event = ticket.event
  const ticketCodes = purchase.ticketCodes as string[]
  
  // Generate QR codes
  const qrCodes = await Promise.all(
    ticketCodes.map(code => QRCode.toDataURL(code))
  )

  // Build the API download URL
  const downloadUrl = `/api/portal/${houseSlug}/tickets/${purchase.id}/download`
  console.log('📥 Download URL:', downloadUrl)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href={`/portal/${houseSlug}/tickets`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Tickets
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{ticket.name}</h1>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              purchase.paymentStatus === 'SUCCEEDED' 
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {purchase.paymentStatus}
            </span>
          </div>

          {event && (
            <Link
              href={`/portal/${houseSlug}/events/${event.id}`}
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4"
            >
              <Calendar className="h-4 w-4" />
              {event.title}
            </Link>
          )}

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Quantity</p>
              <p className="font-medium text-gray-900">{purchase.quantity}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Paid</p>
              <p className="font-medium text-gray-900">
                {purchase.currency} {purchase.totalAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Purchased</p>
              <p className="font-medium text-gray-900">
                {new Date(purchase.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Your Tickets</h2>
        
        {ticketCodes.map((code, index) => {
          const validation = purchase.validations.find(v => v.ticketCode === code)
          const isValidated = !!validation
          
          return (
            <div key={code} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <img src={qrCodes[index]} alt="QR Code" className="w-32 h-32" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900">Ticket #{index + 1}</h3>
                    {isValidated ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        Redeemed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        <Clock className="h-3 w-3" />
                        Not Redeemed
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-2">Code: {code}</p>
                  
                  {event && (
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(event.startDate).toLocaleString()}
                      </p>
                      {event.location && (
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {isValidated && validation && (
                    <p className="text-xs text-gray-500 mt-2">
                      Redeemed on {new Date(validation.validatedAt).toLocaleString()}
                      {validation.entryPoint && ` at ${validation.entryPoint}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Download All */}
      <div className="flex justify-end">
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download All Tickets
        </a>
      </div>
    </div>
  )
}