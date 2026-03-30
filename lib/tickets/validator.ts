import { Ticket, TicketPurchase, TicketValidation } from "@prisma/client"

export interface ValidationResult {
  isValid: boolean
  reason?: string
  ticket?: Ticket
  purchase?: TicketPurchase
}

export interface TicketWithDetails extends Ticket {
  purchase: TicketPurchase
  validations?: TicketValidation[]
}

export function validateTicket(
  ticket: TicketWithDetails,
  isReentry: boolean = false
): ValidationResult {
  const now = new Date()

  // Check ticket status
  if (ticket.status !== "ACTIVE") {
    return { isValid: false, reason: "Ticket is not active" }
  }

  // Check validity period
  if (now < ticket.validFrom) {
    return { isValid: false, reason: "Ticket not yet valid" }
  }

  if (now > ticket.validUntil) {
    return { isValid: false, reason: "Ticket has expired" }
  }

  // Check if fully used
  if (ticket.purchase.fullyUsed) {
    return { isValid: false, reason: "Ticket has been fully used" }
  }

  // Check remaining uses
  if (!isReentry && ticket.purchase.usedCount >= ticket.purchase.quantity) {
    return { isValid: false, reason: "All tickets have been used" }
  }

  // Check for reentry
  if (isReentry) {
    const lastValidation = ticket.validations?.slice(-1)[0]
    if (lastValidation && !lastValidation.isReentry) {
      return { isValid: true, reason: "Valid for reentry" }
    }
    return { isValid: false, reason: "No previous entry found" }
  }

  return { isValid: true, ticket: ticket, purchase: ticket.purchase }
}

export function validateTicketForEvent(
  ticket: TicketWithDetails,
  eventId: string
): ValidationResult {
  if (ticket.eventId && ticket.eventId !== eventId) {
    return { isValid: false, reason: "Ticket is not valid for this event" }
  }
  return validateTicket(ticket)
}

export function validateTicketForHouse(
  ticket: TicketWithDetails,
  houseId: string
): ValidationResult {
  if (ticket.houseId && ticket.houseId !== houseId) {
    return { isValid: false, reason: "Ticket is not valid for this house" }
  }
  return validateTicket(ticket)
}

export function canRefundTicket(
  ticket: TicketWithDetails,
  refundDeadline?: Date | null
): { allowed: boolean; reason?: string } {
  if (!ticket.isRefundable) {
    return { allowed: false, reason: "This ticket is non-refundable" }
  }

  if (refundDeadline && new Date() > refundDeadline) {
    return { allowed: false, reason: "Refund deadline has passed" }
  }

  if (ticket.purchase.usedCount > 0) {
    return { allowed: false, reason: "Ticket has already been used" }
  }

  if (ticket.status !== "ACTIVE") {
    return { allowed: false, reason: "Ticket is not active" }
  }

  return { allowed: true }
}