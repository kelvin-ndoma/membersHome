import { EventType, EventStatus, RSVPStatus } from "@prisma/client"

export interface Event {
  id: string
  organizationId: string
  houseId: string | null
  createdBy: string
  title: string
  slug: string
  description: string | null
  startDate: Date
  endDate: Date
  timezone: string
  location: string | null
  address: any | null
  onlineUrl: string | null
  type: EventType
  isFree: boolean
  capacity: number | null
  price: number | null
  currency: string
  status: EventStatus
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface RSVP {
  id: string
  eventId: string
  membershipId: string
  organizationId: string
  houseId: string | null
  status: RSVPStatus
  guestsCount: number
  notes: string | null
  checkedInAt: Date | null
  checkedInBy: string | null
  amountPaid: number | null
  currency: string | null
}

export interface CreateEventData {
  title: string
  description?: string
  startDate: Date
  endDate: Date
  timezone?: string
  location?: string
  address?: any
  onlineUrl?: string
  type?: EventType
  isFree?: boolean
  capacity?: number
  price?: number
  currency?: string
  houseId?: string
}

export interface UpdateEventData {
  title?: string
  description?: string
  startDate?: Date
  endDate?: Date
  location?: string
  address?: any
  onlineUrl?: string
  type?: EventType
  isFree?: boolean
  capacity?: number
  price?: number
  status?: EventStatus
}