import { PlatformRole } from "@prisma/client"

export interface User {
  id: string
  email: string
  emailVerified: Date | null
  name: string | null
  image: string | null
  phone: string | null
  platformRole: PlatformRole
  mfaEnabled: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface UpdateUserData {
  name?: string
  image?: string
  phone?: string
  email?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}