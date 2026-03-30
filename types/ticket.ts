import { TicketType, TicketStatus, PaymentStatus } from "@prisma/client"

export interface Ticket {
  id: string
  organizationId: string
  houseId: string | null
  eventId: string | null
  name: string
  description: string | null
  slug: string | null
  type: TicketType
  price: number
  currency: string
  earlyBirdPrice: number | null
  memberPrice: number | null
  publicPrice: number | null
  totalQuantity: number
  soldQuantity: number
  reservedQuantity: number
  maxPerPurchase: number
  memberOnly: boolean
  requiresApproval: boolean
  salesStartAt: Date
  salesEndAt: Date
  validFrom: Date
  validUntil: Date
  isPublic: boolean
  isRefundable: boolean
  refundDeadline: Date | null
  metadata: any
  status: TicketStatus
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface TicketPurchase {
  id: string
  ticketId: string
  organizationId: string
  houseId: string | null
  membershipId: string | null
  userId: string | null
  quantity: number
  unitPrice: number
  totalAmount: number
  currency: string
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  paymentStatus: PaymentStatus
  paidAt: Date | null
  paymentMethod: string | null
  ticketCodes: string[]
  usedCount: number
  fullyUsed: boolean
  metadata: any
  notes: string | null
}

export interface TicketValidation {
  id: string
  ticketId: string
  purchaseId: string
  validatorMembershipId: string | null
  ticketCode: string
  attendeeName: string | null
  attendeeEmail: string | null
  validatedAt: Date
  entryPoint: string | null
  gateNumber: string | null
  isValid: boolean
  invalidReason: string | null
  isReentry: boolean
}

export interface CreateTicketData {
  name: string
  description?: string
  type?: TicketType
  price: number
  currency?: string
  totalQuantity: number
  maxPerPurchase?: number
  memberOnly?: boolean
  salesStartAt: Date
  salesEndAt: Date
  validFrom: Date
  validUntil: Date
  isPublic?: boolean
  eventId?: string
  houseId?: string
  earlyBirdPrice?: number
  memberPrice?: number
}

export interface UpdateTicketData {
  name?: string
  description?: string
  price?: number
  totalQuantity?: number
  maxPerPurchase?: number
  memberOnly?: boolean
  salesStartAt?: Date
  salesEndAt?: Date
  validFrom?: Date
  validUntil?: Date
  status?: TicketStatus
  isPublic?: boolean
}

export interface PurchaseTicketData {
  ticketId: string
  quantity: number
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  membershipId?: string
  metadata?: any
}