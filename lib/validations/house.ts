import { z } from "zod"

export const createHouseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").max(50, "Slug must be less than 50 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  logoUrl: z.string().url("Must be a valid URL").optional().nullable(),
  isPrivate: z.boolean().optional().default(false),
  settings: z.any().optional(),
})

export const updateHouseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional().nullable(),
  logoUrl: z.string().url("Must be a valid URL").optional().nullable(),
  isPrivate: z.boolean().optional(),
  settings: z.any().optional(),
})

export const updateMemberRoleSchema = z.object({
  role: z.enum(["HOUSE_MEMBER", "HOUSE_STAFF", "HOUSE_MANAGER", "HOUSE_ADMIN"]),
  staffPosition: z.string().max(100, "Position must be less than 100 characters").optional().nullable(),
  managerLevel: z.number().min(1, "Manager level must be at least 1").max(10, "Manager level must be at most 10").optional().nullable(),
})

export const inviteMemberSchema = z.object({
  email: z.string().email("Must be a valid email"),
  role: z.enum(["HOUSE_MEMBER", "HOUSE_STAFF", "HOUSE_MANAGER", "HOUSE_ADMIN"]).optional().default("HOUSE_MEMBER"),
})