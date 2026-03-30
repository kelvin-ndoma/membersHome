import { Ticket } from "@prisma/client"

export interface PricingContext {
  isMember: boolean
  isEarlyBird: boolean
  quantity: number
  memberSince?: Date
  groupSize?: number
  promoCode?: string
}

export interface PricingResult {
  unitPrice: number
  totalPrice: number
  discounts: Discount[]
}

export interface Discount {
  type: string
  amount: number
  description: string
}

export function calculateTicketPrice(
  ticket: Ticket,
  context: PricingContext
): PricingResult {
  let unitPrice = ticket.price
  const discounts: Discount[] = []

  // Member discount
  if (context.isMember && ticket.memberPrice !== null && ticket.memberPrice !== undefined) {
    const memberDiscount = ticket.price - ticket.memberPrice
    if (memberDiscount > 0) {
      discounts.push({
        type: "member",
        amount: memberDiscount,
        description: "Member discount",
      })
      unitPrice = ticket.memberPrice
    }
  }

  // Early bird discount
  if (context.isEarlyBird && ticket.earlyBirdPrice !== null && ticket.earlyBirdPrice !== undefined) {
    const earlyBirdDiscount = unitPrice - ticket.earlyBirdPrice
    if (earlyBirdDiscount > 0) {
      discounts.push({
        type: "early_bird",
        amount: earlyBirdDiscount,
        description: "Early bird discount",
      })
      unitPrice = ticket.earlyBirdPrice
    }
  }

  // Bulk discount for group purchases
  if (context.quantity >= 10 && ticket.type === "GROUP") {
    const bulkDiscount = unitPrice * 0.1
    discounts.push({
      type: "bulk",
      amount: bulkDiscount,
      description: "10% bulk discount for group purchase",
    })
    unitPrice = unitPrice - bulkDiscount
  }

  const totalPrice = unitPrice * context.quantity

  return {
    unitPrice: Math.round(unitPrice * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    discounts,
  }
}

export function getDynamicPrice(
  basePrice: number,
  soldQuantity: number,
  totalQuantity: number,
  daysUntilEvent: number
): number {
  let multiplier = 1

  // Increase price based on demand
  const demandRatio = soldQuantity / totalQuantity
  if (demandRatio > 0.8) {
    multiplier = 1.2
  } else if (demandRatio > 0.6) {
    multiplier = 1.1
  } else if (demandRatio > 0.4) {
    multiplier = 1.05
  }

  // Decrease price as event gets closer
  if (daysUntilEvent < 1) {
    multiplier = multiplier * 1.2
  } else if (daysUntilEvent < 3) {
    multiplier = multiplier * 1.1
  } else if (daysUntilEvent > 30) {
    multiplier = multiplier * 0.9
  }

  return Math.round(basePrice * multiplier * 100) / 100
}