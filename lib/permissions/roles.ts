import { PlatformRole, OrganizationRole, HouseRole } from "@prisma/client"

export interface UserPermissionContext {
  userId: string
  platformRole: PlatformRole
  organizationRole?: OrganizationRole
  houseRole?: HouseRole
}

type PermissionFunction = (user: UserPermissionContext) => boolean

export const permissions: Record<string, PermissionFunction> = {
  // Platform permissions
  "platform:manage": (user: UserPermissionContext) => 
    user.platformRole === "PLATFORM_ADMIN",
  
  "admin:view": (user: UserPermissionContext) => 
    user.platformRole === "PLATFORM_ADMIN",
  
  // Organization permissions
  "organization:manage": (user: UserPermissionContext) => 
    user.organizationRole === "ORG_ADMIN" || user.organizationRole === "ORG_OWNER",
  
  "members:manage": (user: UserPermissionContext) => 
    user.organizationRole === "ORG_ADMIN" || user.organizationRole === "ORG_OWNER",
  
  "houses:create": (user: UserPermissionContext) => 
    user.organizationRole === "ORG_ADMIN" || user.organizationRole === "ORG_OWNER",
  
  "reports:view": (user: UserPermissionContext) => 
    user.organizationRole === "ORG_ADMIN" || user.organizationRole === "ORG_OWNER",
  
  // House permissions
  "house:manage": (user: UserPermissionContext) => 
    user.houseRole === "HOUSE_ADMIN" || user.houseRole === "HOUSE_MANAGER",
  
  "house:members:manage": (user: UserPermissionContext) => 
    user.houseRole === "HOUSE_ADMIN" || user.houseRole === "HOUSE_MANAGER",
  
  "events:create": (user: UserPermissionContext) => 
    user.houseRole === "HOUSE_ADMIN" || user.houseRole === "HOUSE_MANAGER" || user.houseRole === "HOUSE_STAFF",
  
  "tickets:sell": (user: UserPermissionContext) => 
    user.houseRole === "HOUSE_ADMIN" || user.houseRole === "HOUSE_MANAGER" || user.houseRole === "HOUSE_STAFF",
  
  "tickets:validate": (user: UserPermissionContext) => 
    user.houseRole === "HOUSE_ADMIN" || user.houseRole === "HOUSE_MANAGER" || user.houseRole === "HOUSE_STAFF",
  
  "house:settings": (user: UserPermissionContext) => 
    user.houseRole === "HOUSE_ADMIN",
}

export const houseRoleHierarchy: Record<HouseRole, number> = {
  HOUSE_MEMBER: 1,
  HOUSE_STAFF: 2,
  HOUSE_MANAGER: 3,
  HOUSE_ADMIN: 4,
}

export const organizationRoleHierarchy: Record<OrganizationRole, number> = {
  MEMBER: 1,
  ORG_ADMIN: 2,
  ORG_OWNER: 3,
}

export function canManageRole(
  currentRole: HouseRole,
  targetRole: HouseRole
): boolean {
  return houseRoleHierarchy[currentRole] > houseRoleHierarchy[targetRole]
}

export function canManageOrgRole(
  currentRole: OrganizationRole,
  targetRole: OrganizationRole
): boolean {
  return organizationRoleHierarchy[currentRole] > organizationRoleHierarchy[targetRole]
}