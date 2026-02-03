// lib/security/encryption.ts
import bcrypt from "bcryptjs"
import crypto from "crypto"

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

export function generateMfaSecret(): string {
  return crypto.randomBytes(20).toString("base64")
}