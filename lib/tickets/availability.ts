import { Ticket, TicketPurchase } from "@prisma/client"

export interface AvailabilityResult {
  available: number
  reserved: number
  sold: number
  total: number
  isAvailable: boolean
  availableUntil?: Date
}

export interface TicketWithStats extends Ticket {
  purchases?: TicketPurchase[]
}

export function checkAvailability(
  ticket: TicketWithStats
): AvailabilityResult {
  const total = ticket.totalQuantity
  const sold = ticket.soldQuantity
  const reserved = ticket.reservedQuantity
  const available = total - sold - reserved

  return {
    available: Math.max(0, available),
    reserved,
    sold,
    total,
    isAvailable: available > 0 && ticket.status === "ACTIVE",
    availableUntil: ticket.salesEndAt,
  }
}

export function canPurchase(
  ticket: TicketWithStats,
  quantity: number,
  isMember: boolean
): { allowed: boolean; reason?: string; available?: number } {
  const now = new Date()
  const availability = checkAvailability(ticket)

  // Check if ticket is active
  if (ticket.status !== "ACTIVE") {
    return { allowed: false, reason: "Ticket is not available for purchase" }
  }

  // Check sales period
  if (now < ticket.salesStartAt) {
    return { allowed: false, reason: "Sales have not started yet" }
  }

  if (now > ticket.salesEndAt) {
    return { allowed: false, reason: "Sales have ended" }
  }

  // Check member only restriction
  if (ticket.memberOnly && !isMember) {
    return { allowed: false, reason: "This ticket is only available to members" }
  }

  // Check availability
  if (!availability.isAvailable) {
    return { allowed: false, reason: "Ticket is sold out" }
  }

  if (availability.available < quantity) {
    return { 
      allowed: false, 
      reason: `Only ${availability.available} tickets available`,
      available: availability.available,
    }
  }

  // Check max per purchase
  if (quantity > ticket.maxPerPurchase) {
    return { 
      allowed: false, 
      reason: `Maximum ${ticket.maxPerPurchase} tickets per purchase`,
    }
  }

  return { allowed: true }
}

export function reserveTickets(
  ticket: TicketWithStats,
  quantity: number
): { success: boolean; reservedQuantity?: number; error?: string } {
  const availability = checkAvailability(ticket)

  if (!availability.isAvailable) {
    return { success: false, error: "Ticket is sold out" }
  }

  if (availability.available < quantity) {
    return { 
      success: false, 
      error: `Only ${availability.available} tickets available`,
    }
  }

  return { 
    success: true, 
    reservedQuantity: ticket.reservedQuantity + quantity,
  }
}

export function getRemainingCapacity(
  ticket: TicketWithStats
): number {
  const availability = checkAvailability(ticket)
  return availability.available
}

export function isSoldOut(ticket: TicketWithStats): boolean {
  const availability = checkAvailability(ticket)
  return !availability.isAvailable
}