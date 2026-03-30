export interface OrganizationSettings {
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    logo?: string
  }
  features?: {
    enableEvents?: boolean
    enableTickets?: boolean
    enableCommerce?: boolean
    enableCommunications?: boolean
  }
  notifications?: {
    emailEnabled?: boolean
    pushEnabled?: boolean
  }
}

export interface HouseSettings {
  theme?: {
    primaryColor?: string
    logo?: string
  }
  features?: {
    enableMemberDirectory?: boolean
    enableEventCreation?: boolean
    enableTicketSales?: boolean
  }
  permissions?: {
    membersCanCreateEvents?: boolean
    membersCanInvite?: boolean
  }
}

export function getDefaultOrganizationSettings(): OrganizationSettings {
  return {
    theme: {
      primaryColor: "#3B82F6",
      secondaryColor: "#1E40AF",
    },
    features: {
      enableEvents: true,
      enableTickets: true,
      enableCommerce: true,
      enableCommunications: true,
    },
    notifications: {
      emailEnabled: true,
      pushEnabled: false,
    },
  }
}

export function getDefaultHouseSettings(): HouseSettings {
  return {
    theme: {
      primaryColor: "#3B82F6",
    },
    features: {
      enableMemberDirectory: true,
      enableEventCreation: true,
      enableTicketSales: true,
    },
    permissions: {
      membersCanCreateEvents: false,
      membersCanInvite: false,
    },
  }
}

export function mergeOrganizationSettings(
  defaultSettings: OrganizationSettings,
  userSettings: Partial<OrganizationSettings>
): OrganizationSettings {
  return {
    theme: {
      ...defaultSettings.theme,
      ...userSettings.theme,
    },
    features: {
      ...defaultSettings.features,
      ...userSettings.features,
    },
    notifications: {
      ...defaultSettings.notifications,
      ...userSettings.notifications,
    },
  }
}

export function mergeHouseSettings(
  defaultSettings: HouseSettings,
  userSettings: Partial<HouseSettings>
): HouseSettings {
  return {
    theme: {
      ...defaultSettings.theme,
      ...userSettings.theme,
    },
    features: {
      ...defaultSettings.features,
      ...userSettings.features,
    },
    permissions: {
      ...defaultSettings.permissions,
      ...userSettings.permissions,
    },
  }
}