import { z } from "zod"

export const createOrganizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").max(50, "Slug must be less than 50 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  website: z.string().url("Must be a valid URL").optional().nullable(),
  plan: z.enum(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"]).optional(),
})

export const updateOrganizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional().nullable(),
  logoUrl: z.string().url("Must be a valid URL").optional().nullable(),
  website: z.string().url("Must be a valid URL").optional().nullable(),
  billingEmail: z.string().email("Must be a valid email").optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional().nullable(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional().nullable(),
  customDomain: z.string().optional().nullable(),
  settings: z.any().optional(),
})

export const organizationSlugSchema = z.object({
  slug: z.string().min(3, "Slug must be at least 3 characters").max(50, "Slug must be less than 50 characters"),
})