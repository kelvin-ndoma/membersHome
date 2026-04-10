// lib/auth/jwt.ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface TokenPayload {
  userId: string;
  email: string;
  purpose: "verify-email" | "reset-password" | "invite" | "member-invite";
  metadata?: Record<string, any>;
}

export function generateToken(payload: TokenPayload, expiresIn: string = "24h"): string {
  // @ts-ignore - jsonwebtoken types are being difficult
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function generateInviteToken(email: string, organizationId: string, role: string): string {
  return generateToken({
    userId: "",
    email,
    purpose: "invite",
    metadata: { organizationId, role },
  }, "7d");
}

export function generateMemberInviteToken(email: string, houseId: string, role: string): string {
  return generateToken({
    userId: "",
    email,
    purpose: "member-invite",
    metadata: { houseId, role },
  }, "7d");
}