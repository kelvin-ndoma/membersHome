export type PlatformRole = "USER" | "PLATFORM_ADMIN"
export type OrganizationRole = "MEMBER" | "ORG_ADMIN" | "ORG_OWNER"
export type HouseRole = "HOUSE_MEMBER" | "HOUSE_STAFF" | "HOUSE_MANAGER" | "HOUSE_ADMIN"

export interface UserWithRoles {
  id: string
  platformRole: PlatformRole
  memberships: {
    organizationId: string
    organizationRole: OrganizationRole
    organization: {
      slug: string
    }
    houseMemberships: {
      houseId: string
      role: HouseRole
      house: {
        slug: string
      }
    }[]
  }[]
}

export function isPlatformAdmin(user: UserWithRoles): boolean {
  return user.platformRole === "PLATFORM_ADMIN"
}

export function isOrgOwner(user: UserWithRoles, organizationId: string): boolean {
  const membership = user.memberships.find(m => m.organizationId === organizationId)
  return membership?.organizationRole === "ORG_OWNER"
}

export function isOrgAdmin(user: UserWithRoles, organizationId: string): boolean {
  const membership = user.memberships.find(m => m.organizationId === organizationId)
  return membership?.organizationRole === "ORG_ADMIN" || membership?.organizationRole === "ORG_OWNER"
}

export function isOrgMember(user: UserWithRoles, organizationId: string): boolean {
  return user.memberships.some(m => m.organizationId === organizationId)
}

export function isHouseAdmin(user: UserWithRoles, houseId: string): boolean {
  for (const membership of user.memberships) {
    const houseMembership = membership.houseMemberships.find(hm => hm.houseId === houseId)
    if (houseMembership?.role === "HOUSE_ADMIN" || houseMembership?.role === "HOUSE_MANAGER") {
      return true
    }
  }
  return false
}

export function isHouseMember(user: UserWithRoles, houseId: string): boolean {
  for (const membership of user.memberships) {
    const houseMembership = membership.houseMemberships.find(hm => hm.houseId === houseId)
    if (houseMembership) return true
  }
  return false
}

export function getUserOrganizations(user: UserWithRoles) {
  return user.memberships.map(m => ({
    id: m.organizationId,
    role: m.organizationRole,
    slug: m.organization.slug
  }))
}

export function getUserHouses(user: UserWithRoles, organizationId?: string) {
  const memberships = organizationId 
    ? user.memberships.filter(m => m.organizationId === organizationId)
    : user.memberships
    
  const houses: { houseId: string; role: HouseRole; slug: string }[] = []
  
  for (const membership of memberships) {
    for (const hm of membership.houseMemberships) {
      houses.push({
        houseId: hm.houseId,
        role: hm.role,
        slug: hm.house.slug
      })
    }
  }
  
  return houses
}