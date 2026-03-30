import { PlanType, OrganizationStatus, OrganizationRole, MembershipStatus } from "@prisma/client"

export interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  website: string | null
  plan: PlanType
  billingEmail: string | null
  status: OrganizationStatus
  primaryColor: string | null
  secondaryColor: string | null
  customDomain: string | null
  settings: any
  createdAt: Date
  updatedAt: Date
  suspendedAt: Date | null
}

export interface Membership {
  id: string
  userId: string
  organizationId: string
  organizationRole: OrganizationRole
  status: MembershipStatus
  title: string | null
  bio: string | null
  phone: string | null
  joinedAt: Date
  invitedBy: string | null
  invitedAt: Date | null
  acceptedAt: Date | null
  lastActiveAt: Date | null
  permissions: any | null
}

export interface CreateOrganizationData {
  name: string
  slug: string
  description?: string
  website?: string
  plan?: PlanType
}

export interface UpdateOrganizationData {
  name?: string
  description?: string
  logoUrl?: string
  website?: string
  billingEmail?: string
  primaryColor?: string
  secondaryColor?: string
  customDomain?: string
  settings?: any
}