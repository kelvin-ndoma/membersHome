import { randomBytes, createHash } from "crypto"

export function generateToken(length: number = 32): string {
  return randomBytes(length).toString("hex")
}

export function generateInviteToken(): string {
  return randomBytes(32).toString("hex")
}

export function generateTicketCode(): string {
  const timestamp = Date.now().toString(36)
  const random = randomBytes(8).toString("hex")
  return `${timestamp}-${random}`.toUpperCase()
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}