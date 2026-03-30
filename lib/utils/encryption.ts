import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto"

const algorithm = "aes-256-gcm"
const password = process.env.ENCRYPTION_KEY || "default-encryption-key-change-me"

function getKey(): Buffer {
  return scryptSync(password, "salt", 32)
}

export function encrypt(text: string): string {
  const iv = randomBytes(16)
  const key = getKey()
  const cipher = createCipheriv(algorithm, key, iv)
  
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encryptedHex] = encryptedText.split(":")
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const encrypted = Buffer.from(encryptedHex, "hex")
  const key = getKey()
  
  const decipher = createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)
  
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString("utf8")
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  const maskedLocal = local.slice(0, 2) + "*".repeat(Math.max(0, local.length - 4)) + local.slice(-2)
  return `${maskedLocal}@${domain}`
}

export function maskPhone(phone: string): string {
  return phone.slice(0, 3) + "****" + phone.slice(-4)
}