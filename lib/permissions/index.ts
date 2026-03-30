import { PlatformRole, OrganizationRole, HouseRole } from "@prisma/client"
import { permissions as rolePermissions, houseRoleHierarchy, organizationRoleHierarchy, canManageRole, canManageOrgRole, UserPermissionContext } from "./roles"
import { getTicketPermissions, canPurchaseTicket, calculateTicketPrice } from "./ticket-permissions"

export type { UserPermissionContext }

export function hasPermission(
  user: UserPermissionContext,
  resource: string,
  action: string
): boolean {
  const permissionKey = `${resource}:${action}` as keyof typeof rolePermissions
  
  const permission = rolePermissions[permissionKey]
  if (!permission) return false
  
  return permission(user)
}

export function canManagePlatform(user: UserPermissionContext): boolean {
  return rolePermissions["platform:manage"](user)
}

export function canViewAdminPanel(user: UserPermissionContext): boolean {
  return rolePermissions["admin:view"](user)
}

export function canManageOrganization(user: UserPermissionContext): boolean {
  return rolePermissions["organization:manage"](user)
}

export function canManageMembers(user: UserPermissionContext): boolean {
  return rolePermissions["members:manage"](user)
}

export function canCreateHouses(user: UserPermissionContext): boolean {
  return rolePermissions["houses:create"](user)
}

export function canManageHouse(user: UserPermissionContext): boolean {
  return rolePermissions["house:manage"](user)
}

export function canManageHouseMembers(user: UserPermissionContext): boolean {
  return rolePermissions["house:members:manage"](user)
}

export function canCreateEvents(user: UserPermissionContext): boolean {
  return rolePermissions["events:create"](user)
}

export function canSellTickets(user: UserPermissionContext): boolean {
  return rolePermissions["tickets:sell"](user)
}

export function canValidateTickets(user: UserPermissionContext): boolean {
  return rolePermissions["tickets:validate"](user)
}

export function canViewReports(user: UserPermissionContext): boolean {
  return rolePermissions["reports:view"](user)
}

export function canManageHouseSettings(user: UserPermissionContext): boolean {
  return rolePermissions["house:settings"](user)
}

export {
  getTicketPermissions,
  canPurchaseTicket,
  calculateTicketPrice,
  houseRoleHierarchy,
  organizationRoleHierarchy,
  canManageRole,
  canManageOrgRole,
}