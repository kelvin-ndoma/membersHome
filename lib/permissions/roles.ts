// Platform-level permissions
export const PlatformPermission = {
  VIEW_ALL_ORGANIZATIONS: "view_all_organizations",
  MANAGE_PLATFORM_SETTINGS: "manage_platform_settings",
  VIEW_PLATFORM_REPORTS: "view_platform_reports",
  SUSPEND_ORGANIZATIONS: "suspend_organizations",
  ACCESS_AUDIT_LOGS: "access_audit_logs",
} as const

export type PlatformPermission = typeof PlatformPermission[keyof typeof PlatformPermission]

// Get all platform permission values as an array
export const PlatformPermissionValues = Object.values(PlatformPermission) as PlatformPermission[]

// Organization-level permissions
export const OrganizationPermission = {
  MANAGE_ORGANIZATION: "manage_organization",
  MANAGE_HOUSES: "manage_houses",
  MANAGE_ORG_ADMINS: "manage_org_admins",
  VIEW_ORG_REPORTS: "view_org_reports",
  CONFIGURE_PAYMENTS: "configure_payments",
  CONFIGURE_BRANDING: "configure_branding",
  SEND_ORG_COMMUNICATIONS: "send_org_communications",
} as const

export type OrganizationPermission = typeof OrganizationPermission[keyof typeof OrganizationPermission]

// Get all organization permission values as an array
export const OrganizationPermissionValues = Object.values(OrganizationPermission) as OrganizationPermission[]

// House-level permissions
export const HousePermission = {
  MANAGE_HOUSE: "manage_house",
  MANAGE_HOUSE_MEMBERS: "manage_house_members",
  CREATE_EVENTS: "create_events",
  SEND_HOUSE_COMMUNICATIONS: "send_house_communications",
  VIEW_HOUSE_REPORTS: "view_house_reports",
} as const

export type HousePermission = typeof HousePermission[keyof typeof HousePermission]

// Get all house permission values as an array
export const HousePermissionValues = Object.values(HousePermission) as HousePermission[]

// Member-level permissions
export const MemberPermission = {
  VIEW_EVENTS: "view_events",
  RSVP_EVENTS: "rsvp_events",
  ACCESS_CONTENT: "access_content",
  VIEW_MEMBER_DIRECTORY: "view_member_directory",
} as const

export type MemberPermission = typeof MemberPermission[keyof typeof MemberPermission]

// Get all member permission values as an array
export const MemberPermissionValues = Object.values(MemberPermission) as MemberPermission[]

// Role to permission mappings
export const ROLE_PERMISSIONS = {
  // Platform roles
  PLATFORM_ADMIN: [
    PlatformPermission.VIEW_ALL_ORGANIZATIONS,
    PlatformPermission.MANAGE_PLATFORM_SETTINGS,
    PlatformPermission.VIEW_PLATFORM_REPORTS,
    PlatformPermission.SUSPEND_ORGANIZATIONS,
    PlatformPermission.ACCESS_AUDIT_LOGS,
  ] as PlatformPermission[],
  
  // Organization roles
  ORG_OWNER: [
    OrganizationPermission.MANAGE_ORGANIZATION,
    OrganizationPermission.MANAGE_HOUSES,
    OrganizationPermission.MANAGE_ORG_ADMINS,
    OrganizationPermission.VIEW_ORG_REPORTS,
    OrganizationPermission.CONFIGURE_PAYMENTS,
    OrganizationPermission.CONFIGURE_BRANDING,
    OrganizationPermission.SEND_ORG_COMMUNICATIONS,
  ] as OrganizationPermission[],
  
  ORG_ADMIN: [
    OrganizationPermission.MANAGE_HOUSES,
    OrganizationPermission.VIEW_ORG_REPORTS,
    OrganizationPermission.SEND_ORG_COMMUNICATIONS,
  ] as OrganizationPermission[],
  
  // House roles
  HOUSE_ADMIN: [
    HousePermission.MANAGE_HOUSE,
    HousePermission.MANAGE_HOUSE_MEMBERS,
    HousePermission.CREATE_EVENTS,
    HousePermission.SEND_HOUSE_COMMUNICATIONS,
    HousePermission.VIEW_HOUSE_REPORTS,
  ] as HousePermission[],
  
  HOUSE_MEMBER: [
    MemberPermission.VIEW_EVENTS,
    MemberPermission.RSVP_EVENTS,
    MemberPermission.ACCESS_CONTENT,
    MemberPermission.VIEW_MEMBER_DIRECTORY,
  ] as MemberPermission[],
  
  // Organization member (no house)
  MEMBER: [
    MemberPermission.VIEW_MEMBER_DIRECTORY,
  ] as MemberPermission[],
} as const