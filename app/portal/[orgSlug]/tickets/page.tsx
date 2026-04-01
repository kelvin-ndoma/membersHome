// app/portal/[orgSlug]/tickets/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { TicketsList } from "./TicketsList"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Ticket } from "lucide-react"

interface TicketsPageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function TicketsPage({ params }: TicketsPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug } = await params

  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/portal/${orgSlug}/tickets`)
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
      status: "ACTIVE",
    },
    include: {
      organization: true,
    },
  })

  if (!membership) {
    redirect(`/organization/${orgSlug}`)
  }

  const tickets = await prisma.ticketPurchase.findMany({
    where: {
      membershipId: membership.id,
    },
    include: {
      ticket: {
        include: {
          event: true,
        },
      },
      validations: true,
    },
    orderBy: { createdAt: "desc" },
  })

  // Transform the data to ensure proper types for client component
  const serializedTickets = tickets.map(ticket => {
    // Safely convert ticketCodes to string array
    let ticketCodes: string[] = []
    if (ticket.ticketCodes && Array.isArray(ticket.ticketCodes)) {
      ticketCodes = ticket.ticketCodes
        .filter((code): code is string => typeof code === "string")
        .map(code => code)
    }

    return {
      id: ticket.id,
      quantity: ticket.quantity,
      totalAmount: ticket.totalAmount,
      currency: ticket.currency,
      paymentStatus: ticket.paymentStatus,
      createdAt: ticket.createdAt,
      ticketCodes,
      usedCount: ticket.usedCount,
      fullyUsed: ticket.fullyUsed,
      ticket: {
        name: ticket.ticket.name,
        event: ticket.ticket.event ? {
          id: ticket.ticket.event.id,
          title: ticket.ticket.event.title,
          startDate: ticket.ticket.event.startDate,
          location: ticket.ticket.event.location,
        } : null,
      },
      validations: ticket.validations.map(validation => ({
        id: validation.id,
        ticketCode: validation.ticketCode,
        validatedAt: validation.validatedAt,
        isValid: validation.isValid,
      })),
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Tickets</h1>
        <p className="text-muted-foreground">View and manage your purchased tickets</p>
      </div>

      {tickets.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No tickets yet</h3>
            <p className="mt-2 text-muted-foreground">
              Tickets you purchase will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <TicketsList tickets={serializedTickets} orgSlug={orgSlug} />
      )}
    </div>
  )
}