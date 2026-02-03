import { prisma } from "@/lib/db"
import { 
  ROLE_PERMISSIONS, 
  PlatformPermission, 
  OrganizationPermission, 
  HousePermission, 
  MemberPermission 
} from "./roles"

export type Permission = 
  | PlatformPermission 
  | OrganizationPermission 
  | HousePermission 
  | MemberPermission

// Type guards to check permission types
export function isPlatformPermission(permission: Permission): permission is PlatformPermission {
  return Object.values(PlatformPermission).includes(permission as PlatformPermission)
}

export function isOrganizationPermission(permission: Permission): permission is OrganizationPermission {
  return Object.values(OrganizationPermission).includes(permission as OrganizationPermission)
}

export function isHousePermission(permission: Permission): permission is HousePermission {
  return Object.values(HousePermission).includes(permission as HousePermission)
}

export function isMemberPermission(permission: Permission): permission is MemberPermission {
  return Object.values(MemberPermission).includes(permission as MemberPermission)
}

export async function hasPlatformPermission(
  userId: string,
  permission: PlatformPermission
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { platformRole: true }
  })

  if (!user) return false
  
  if (user.platformRole === "PLATFORM_ADMIN") {
    return ROLE_PERMISSIONS.PLATFORM_ADMIN.includes(permission)
  }

  return false
}

export async function hasOrganizationPermission(
  userId: string,
  organizationId: string,
  permission: OrganizationPermission
): Promise<boolean> {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      organizationId,
      status: "ACTIVE",
    },
    select: { organizationRole: true }
  })

  if (!membership) return false

  const role = membership.organizationRole
  
  if (role === "ORG_OWNER") {
    return ROLE_PERMISSIONS.ORG_OWNER.includes(permission)
  }
  
  if (role === "ORG_ADMIN") {
    return ROLE_PERMISSIONS.ORG_ADMIN.includes(permission)
  }

  return false
}

export async function hasHousePermission(
  userId: string,
  organizationId: string,
  houseId: string,
  permission: HousePermission | MemberPermission
): Promise<boolean> {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      organizationId,
      houseId,
      status: "ACTIVE",
    },
    select: { houseRole: true, organizationRole: true }
  })

  if (!membership) return false

  // House admins get house permissions
  if (membership.houseRole === "HOUSE_ADMIN") {
    return ROLE_PERMISSIONS.HOUSE_ADMIN.includes(permission as HousePermission)
  }

  // House members get member permissions
  if (membership.houseRole === "HOUSE_MEMBER") {
    return ROLE_PERMISSIONS.HOUSE_MEMBER.includes(permission as MemberPermission)
  }

  // Organization admins/owners get all house permissions
  if (membership.organizationRole === "ORG_ADMIN" || membership.organizationRole === "ORG_OWNER") {
    return true // Full access
  }

  return false
}

export async function requirePermission(
  userId: string,
  permission: Permission,
  organizationId?: string,
  houseId?: string
): Promise<void> {
  let hasPermission = false

  if (organizationId && houseId) {
    // For house-level permissions, check if it's a valid house/member permission
    if (isHousePermission(permission) || isMemberPermission(permission)) {
      hasPermission = await hasHousePermission(userId, organizationId, houseId, permission)
    } else {
      throw new Error(`Invalid permission type for house context: ${permission}`)
    }
  } else if (organizationId) {
    // For organization-level permissions, check if it's a valid organization permission
    if (isOrganizationPermission(permission)) {
      hasPermission = await hasOrganizationPermission(userId, organizationId, permission)
    } else {
      throw new Error(`Invalid permission type for organization context: ${permission}`)
    }
  } else {
    // For platform-level permissions, check if it's a valid platform permission
    if (isPlatformPermission(permission)) {
      hasPermission = await hasPlatformPermission(userId, permission)
    } else {
      throw new Error(`Invalid permission type for platform context: ${permission}`)
    }
  }

  if (!hasPermission) {
    throw new Error("Permission denied")
  }
}

// Helper function to check permission based on context
export async function checkPermission(
  userId: string,
  permission: Permission,
  organizationId?: string,
  houseId?: string
): Promise<boolean> {
  try {
    await requirePermission(userId, permission, organizationId, houseId)
    return true
  } catch {
    return false
  }
}