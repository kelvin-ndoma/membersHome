import { HouseRole, OrganizationRole } from "@prisma/client"

export interface TicketPermissions {
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canSell: boolean
  canValidate: boolean
  canRefund: boolean
  canViewSales: boolean
  canViewReports: boolean
}

export function getTicketPermissions(
  organizationRole?: OrganizationRole,
  houseRole?: HouseRole
): TicketPermissions {
  const isOrgAdmin = organizationRole === "ORG_ADMIN" || organizationRole === "ORG_OWNER"
  const isHouseAdmin = houseRole === "HOUSE_ADMIN"
  const isHouseManager = houseRole === "HOUSE_MANAGER"
  const isHouseStaff = houseRole === "HOUSE_STAFF"
  const isHouseMember = houseRole === "HOUSE_MEMBER"

  return {
    canCreate: isOrgAdmin || isHouseAdmin || isHouseManager || isHouseStaff,
    canEdit: isOrgAdmin || isHouseAdmin || isHouseManager,
    canDelete: isOrgAdmin || isHouseAdmin,
    canSell: isOrgAdmin || isHouseAdmin || isHouseManager || isHouseStaff,
    canValidate: isOrgAdmin || isHouseAdmin || isHouseManager || isHouseStaff,
    canRefund: isOrgAdmin || isHouseAdmin || isHouseManager,
    canViewSales: isOrgAdmin || isHouseAdmin || isHouseManager || isHouseStaff,
    canViewReports: isOrgAdmin || isHouseAdmin || isHouseManager,
  }
}

export function canPurchaseTicket(
  isMember: boolean,
  memberOnly: boolean,
  ticketStatus: string,
  salesStartAt: Date,
  salesEndAt: Date
): { allowed: boolean; reason?: string } {
  const now = new Date()

  if (memberOnly && !isMember) {
    return { allowed: false, reason: "This ticket is only available to members" }
  }

  if (ticketStatus !== "ACTIVE") {
    return { allowed: false, reason: "Ticket is not available for purchase" }
  }

  if (now < salesStartAt) {
    return { allowed: false, reason: "Ticket sales have not started yet" }
  }

  if (now > salesEndAt) {
    return { allowed: false, reason: "Ticket sales have ended" }
  }

  return { allowed: true }
}

export function calculateTicketPrice(
  basePrice: number,
  memberPrice: number | null,
  earlyBirdPrice: number | null,
  isMember: boolean,
  isEarlyBird: boolean
): number {
  if (isMember && memberPrice !== null && memberPrice !== undefined) {
    return memberPrice
  }

  if (isEarlyBird && earlyBirdPrice !== null && earlyBirdPrice !== undefined) {
    return earlyBirdPrice
  }

  return basePrice
}

export function canRefundTicket(
  ticketStatus: string,
  isRefundable: boolean,
  refundDeadline: Date | null,
  usedCount: number,
  salesEndAt: Date
): { allowed: boolean; reason?: string } {
  const now = new Date()

  if (!isRefundable) {
    return { allowed: false, reason: "This ticket is non-refundable" }
  }

  if (refundDeadline && now > refundDeadline) {
    return { allowed: false, reason: "Refund deadline has passed" }
  }

  if (usedCount > 0) {
    return { allowed: false, reason: "Ticket has already been used" }
  }

  if (ticketStatus !== "ACTIVE") {
    return { allowed: false, reason: "Ticket is not active" }
  }

  if (now > salesEndAt) {
    return { allowed: false, reason: "Sales period has ended" }
  }

  return { allowed: true }
}